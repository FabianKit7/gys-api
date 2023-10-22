import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe'
import { sendSMS } from '..';

dotenv.config({ path: '.env' });
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', async (req, res) => {
    return res.json({});
});

function getUnixTimestampForSevenDaysLater() {
    const currentDate = new Date();
    const sevenDaysLater = new Date(currentDate);
    sevenDaysLater.setDate(currentDate.getDate() + 7); // Add 7 days to the current date
    return Math.floor(sevenDaysLater.getTime() / 1000); // Convert to Unix timestamp (in seconds)
}

// new subscription with 7days trial.
router.post('/create_subscription', async (req, res) => {
    try {
        const { username, name, email, paymentMethod, price } = req.body;
        // console.log({ name, email, paymentMethod, price });
        const customer = await stripe.customers.create({
            name, email,
            payment_method: paymentMethod,
            invoice_settings: { default_payment_method: paymentMethod }
        })

        // const product = await stripe.products.create({
        //     name: "Monthly Subscription",
        // })

        const trial_end = getUnixTimestampForSevenDaysLater() //# 7 days free trial

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                // { price_data: { currency: "USD", product: product.id, unit_amount: "40000", recurring: { interval: "month" }} },
                { price }
            ],
            trial_end,
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: "on_subscription"
            },
            expand: ['latest_invoice.payment_intent']
        })

        // console.log({
        //     message: `Subscription successful!`,
        //     customer,
        //     subscription,
        //     clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret
        // });

        if(subscription){
            await sendSMS(`@${username} with email ${email} has just registered for a free trial. \n+15 portions cevapa kod cesma added.`);
            console.log(`Subscription created for ${email} \n trial ends at: ${trial_end} \n`);
        }

        return res.status(200).json({
            message: `Subscription successful!`,
            customer,
            subscription,
            clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: `${error}` });
    }
});

router.post('/create_subscription_for_customer', async (req, res) => {
    try {
        const { customer_id, price } = req.body;

        const subscription = await stripe.subscriptions.create({
            customer: customer_id,
            items: [{ price }],
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: "on_subscription"
            },
            expand: ['latest_invoice.payment_intent']
        })

        if(subscription){
            console.log(`Subscription created for customer: ${customer_id}; direct billing \n`);
        }

        return res.status(200).json({
            message: `Subscription successful!`,
            subscription,
            clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: `${error}` });
    }
});

router.post('/cancel_subscription', async (req, res) => {
    try {
        const { subscription_id } = req.body;
        await stripe.subscriptions.cancel(subscription_id)
        console.log(`Subscription: ${subscription_id} has been cancelled! \n`);
        return res.status(200).json({ message: `Subscription cancelled successful!` });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: `${error}` });
    }
});

router.post('/retrieve_customer', async (req, res) => {
    const { customer_id } = req.body;
    const customer = await stripe.customers.retrieve(
        customer_id
    ).catch(err => err);
    return res.json(customer);
});

router.post('/list_payment_methods', async (req, res) => {
    const { customer_id } = req.body;
    const paymentMethods = await stripe.customers.listPaymentMethods(
        customer_id,
        { type: 'card' }
    ).catch(err => err);
    return res.json(paymentMethods);
});

router.post('/attach_payment_method_to_customer', async (req, res) => {
    const { customer_id, pm_id } = req.body;
    const paymentMethod = await stripe.paymentMethods.attach(
        pm_id,
        { customer: customer_id }
    ).catch(err => err);
    return res.json(paymentMethod);
});

export default router