import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe'
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });
const router = express.Router();
const SK = process.env.NODE_ENV === "production" ? process.env.STRIPE_SECRET_KEY : "sk_test_51LY8WXGqRSmA1tlMkLI09WQj5UZGO70XiSETYHWo27q4pxK8ywZCA867dJAfj7hKjeuBqHGeDl8WDAJpbcKxVxC200lcwZynJz"
const stripe = new Stripe(SK);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/', async (req, res) => {
    return res.json({});
});

// export const sendSMS = async (content) => {
//     const apiKey = process.env.BREVO_SMS_API_KEY;
//     const apiUrl = 'https://api.brevo.com/v3/transactionalSMS/sms';

//     // const recipients = ['+2348112659304'];
//     const recipients = ['+38631512279', '+387603117027'];
//     for (const recipient of recipients) {
//         const smsData = {
//             type: 'transactional',
//             unicodeEnabled: false,
//             sender: 'gys',
//             recipient,
//             content
//         };

//         await axios
//             .post(apiUrl, smsData, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'api-key': apiKey,
//                     'Accept': 'application/json'
//                 }
//             })
//             .then((response) => {
//                 console.log('SMS sent successfully:', response.data);
//                 return ({ success: true, message: 'SMS sent successfully' })
//             })
//             .catch((error) => {
//                 console.error('Error sending SMS:', error);
//                 return ({ success: false, message: `Error sending SMS: ${error}` })
//             });
//     }
// }


function getUnixTimestampForSevenDaysLater() {
    const currentDate = new Date();
    const sevenDaysLater = new Date(currentDate);
    sevenDaysLater.setDate(currentDate.getDate() + 7); // Add 7 days to the current date
    return Math.floor(sevenDaysLater.getTime() / 1000); // Convert to Unix timestamp (in seconds)
}

router.post("/create_payment_intent", async (req, res) => {
    try {
      // const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "USD",
        payment_method_types: ["card"],
        // payment_method_types: ['card', 'apple_pay', 'google_pay'],
        // automatic_payment_methods: {
        //     enabled: true
        // },
      });
  
      // console.log('paymentIntent');
      // console.log(paymentIntent);
  
      return res.status(200).json({
        clientSecret: paymentIntent?.client_secret,
        paymentIntent,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: `Internal server error: ${error}` });
    }
  });

// new subscription with 7days trial.
router.post('/create_subscription', async (req, res) => {
    try {
        const { username, name, email, paymentMethod, price, customer_id } = req.body;
        // console.log({ name, email, paymentMethod, price });
        var customer = null
        if(customer_id) {
            customer = await stripe.customers.retrieve(
                customer_id
            ).catch(err => err);
        }else{
            customer = await stripe.customers.create({
                name: name || username || '', 
                email,
                payment_method: paymentMethod,
                invoice_settings: { default_payment_method: paymentMethod }
            })
        }

        // const product = await stripe.products.create({
        //     name: "Monthly Subscription",
        // })

        const trial_end = getUnixTimestampForSevenDaysLater() //# 7 days free trial
        const subData = {
            customer: customer.id,
            items: [
                // { price_data: { currency: "USD", product: product.id, unit_amount: "40000", recurring: { interval: "month" }} },
                { price }
            ],
            trial_end, // no trial
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: "on_subscription"
            },
            expand: ['latest_invoice.payment_intent']
        }
        // check if user's username is in the freeTrialAllowed list
        var is_allowed = true;
        // try {
        //     const { data } = await supabase.from('freeTrialAllowed').select().eq('username', username).single()
        //     is_allowed = data ? true : false;
        //     if (!is_allowed) {
        //         delete subData.trial_end;
        //     }
        // } catch (err) {
        //     delete subData.trial_end;
        // }
        const subscription = await stripe.subscriptions.create(subData)

        // console.log({
        //     message: `Subscription successful!`,
        //     customer,
        //     subscription,
        //     clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret
        // });

        if (subscription) {
            // await sendSMS(`@${username} with email ${email} has just registered for a free trial.`);
            // console.log(`Subscription created for ${email} \n trial ends at: ${trial_end} \n`);
            // await sendSMS(`@${username} with email ${email} has just registered. ${is_allowed && ' with free trial.'}`);
            console.log(`Subscription created for ${email} \n ${is_allowed && ' with free trial'}`);
        }

        return res.status(200).json({
            message: `Subscription successful!`,
            customer,
            subscription,
            clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret,
        });
    } catch (error) {
        console.error(error);
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

        if (subscription) {
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