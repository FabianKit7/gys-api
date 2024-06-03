import express from "express";
import cors from "cors";
import NodeMailer from "nodemailer";
import dotenv from "dotenv";
import stripeRoutes, { sendSMS } from "./routes/stripeRoutes.js";
import bodyParser from "body-parser";
import axios from "axios";
import Slack from "@slack/bolt";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
const PORT = process.env.PORT || 8000;
const app = express();
// app.use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const SCRAPER_API_URL =
  "https://instagram-bulk-profile-scrapper.p.rapidapi.com/clients/api/ig/ig_profile";
const X_RAPID_API_HOST = "instagram-bulk-profile-scrapper.p.rapidapi.com";
const X_RAPID_API_KEY = process.env.X_RAPID_API_KEY;

const send_email = (to, subject, content) => {
  if (!to || !subject || !content) {
    console.log("failed to send email: params missing");
    !to && console.log("to:", to);
    !subject && console.log("subject:", subject);
    !content && console.log("no content");
    return { success: false, message: "failed to send email: params missing" };
  }

  try {
    const transporter = NodeMailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      debug: true,
      auth: {
        user: process.env.SMPT_LOGIN,
        pass: process.env.SMPT_KEY,
      },
    });
    // console.log(`to: ${to}, subject: ${subject}`);
    transporter.sendMail(
      {
        from: "Grow-your-social support@grow-your-social.com",
        to,
        subject,
        html: content,
        sender: {
          name: "Grow-your-social",
          email: "support@grow-your-social.com",
        },
      },
      (error, info) => {
        if (error) {
          console.log(
            "failed to sent email to: " + info?.accepted?.[0] + " due to: "
          );
          console.log(error.message);
          console.log(error);
          console.log(error.message);
          return { success: false, message: error.message };
        } else {
          console.log("email sent to: " + info?.accepted?.[0]);
          return { success: true, message: info?.response };
        }
      }
    );
  } catch (error) {
    console.log(
      "failed to sent email due to: "
    );
    console.log(error.message);
    console.log(error);
    console.log(error.message);
    return { success: false, message: error.message };
  }
};

// const slackApp = new Slack.App({
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
//   token: process.env.SLACK_BOT_TOKEN,
// });

const updateUsersGraphDataCron = async () => {
  console.log("\n\nupdateUsersGraphData cron job started...");
  try {
    // Fetch users from the database
    const { data: users, error } = await fetchUsers();
    if (error) {
      console.error("Failed to get users:", error.message);
      return;
    }

    const filteredData = users.filter((user) => needsGraphData(user));

    console.log(`Users that need Dummy data: ${filteredData.length}`);

    // Process each user in batches to avoid rate limiting
    await processUsersInBatches(filteredData, dummyGraphGenerator);
  } catch (error) {
    console.error("Error in updateUsersGraphDataCron:", error.message);
  }
  console.log("updateUsersGraphData cron job done\n\n");
};

// Fetch users from the database
const fetchUsers = async () => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, dummyData, status, created_at")
    .in("status", ["active", "checking", "new"])
    .order("created_at", { ascending: false });

  return { data, error };
};

// Check if a user needs dummy data
const needsGraphData = (user) => {
  if (user.dummyData.length === 0) return true;
  const lastDataPointDate = new Date(
    user.dummyData[user.dummyData.length - 1].start_time
  );
  const currentDate = new Date();
  return !(
    lastDataPointDate.getFullYear() === currentDate.getFullYear() &&
    lastDataPointDate.getMonth() === currentDate.getMonth() &&
    lastDataPointDate.getDate() === currentDate.getDate()
  );
};

// Process users in batches to avoid rate limiting
const processUsersInBatches = async (users, callback) => {
  const requestsPerMinuteLimit = 25;
  let apiRequestCounter = 0;
  let retries = 0;
  const maxRetries = 10;
  // const retryDelay = 30000; // 30 seconds
  const doneList = [];
  let lastRequestTime = Date.now();

  while (retries < maxRetries && doneList.length !== users.length) {
    console.log({ retries, apiRequestCounter });

    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - lastRequestTime;
    console.log({ timeSinceLastRequest });

    // If 25 API calls have been made and less than a minute has passed since the first of those calls, wait.
    // if (apiRequestCounter >= requestsPerMinuteLimit) {
    if (
      timeSinceLastRequest > 60000 &&
      apiRequestCounter >= requestsPerMinuteLimit
    ) {
      const waitTime = 60000 - timeSinceLastRequest;
      console.log(
        `waiting for ${waitTime / 1000} seconds before continuing...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      apiRequestCounter = 0;
      lastRequestTime = Date.now();
    }

    for (const user of users) {
      if (doneList.find((u) => u.username === user.username)) continue;
      console.log(`Processing ${user.username}`);
      await callback(user);
      console.log(`\n\n`);
      apiRequestCounter++;
      doneList.push(user);

      console.log("doneList.length");
      console.log(doneList.length);

      if (
        timeSinceLastRequest > 60000 &&
        apiRequestCounter >= requestsPerMinuteLimit
      )
        break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    retries++;
  }

  if (doneList.length === users.length) {
    console.log("all done");
  }

  if (users.length === 0) {
    console.log("0 users found");
  }
};

// Generate dummy graph data for a user
const dummyGraphGenerator = async (user) => {
  try {
    const params = {
      ig: user.username,
      response_type: "short",
      corsEnabled: "false",
      storageEnabled: "true",
    };
    const options = {
      method: "GET",
      url: SCRAPER_API_URL,
      params,
      headers: {
        "X-RapidAPI-Key": X_RAPID_API_KEY,
        "X-RapidAPI-Host": X_RAPID_API_HOST,
      },
    };

    const start_get_vuser = Date.now();
    const userResults = await axios.request(options);
    console.log(
      `get vuser took: ${(Date.now() - start_get_vuser) / 1000}`
    );
    const vuser = userResults.data?.[0];

    if (vuser) {
      await updateUserGraphData(user, vuser);
    } else {
      console.error("No valid user data found for", user.username);
    }
  } catch (error) {
    console.error(`Error processing ${user.username}:`, error.message);
  }
};

// Update user dummy data in the database
const updateUserGraphData = async (user, vuser) => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${(
    currentDate.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${currentDate
    .getDate()
    .toString()
    .padStart(2, "0")} ${currentDate
    .getHours()
    .toString()
    .padStart(2, "0")}:${currentDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${currentDate
    .getSeconds()
    .toString()
    .padStart(2, "0")}.${currentDate
    .getMilliseconds()
    .toString()
    .padStart(6, "0")}`;

  const dataPoint = {
    profile: {
      followers: vuser.follower_count,
      following: vuser.following_count,
      total_interactions: 0,
    },
    start_time: formattedDate,
  };

  console.log("graphData for: " + user.username);
  console.log(dataPoint);

  // console.log(`start supabase update: ${Date.now()}`);
  const start_supabase_update = Date.now();
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      dummyData: [...(user.dummyData || []), dataPoint],
    })
    .eq("id", user.id); // 0.3s average
  console.log(
    `supabase update took: ${(Date.now() - start_supabase_update) / 1000}`
  );

  if (error) {
    console.error(
      `Failed to update ${user.username}'s graph data:`,
      error.message
    );
  } else {
    console.log(`${user.username} updated successfully`);
  }
};

updateUsersGraphDataCron();

// Schedule the cron job to run every day at 7am
cron.schedule("0 6 * * *", updateUsersGraphDataCron);

console.log("Scheduled the cron job to run every day at 7am (0 7 * * *)");

app.post("/api/slack-notify", async (req, res) => {
  const { username, cancellation } = req.body;
  const blocks = [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: `@${username} ${
          cancellation
            ? "cancelled their subscription"
            : "just registered for a free trial."
        }`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View",
            emoji: true,
          },
          value: "dashboard",
          url: "https://app.grow-your-social.com/admin/manage",
        },
      ],
    },
  ];
  try {
    const slackApp = new Slack.App({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      token: process.env.SLACK_BOT_TOKEN,
    });

    const channel = cancellation ? "new-cancellations" : "new-subscriptions";

    const response = await slackApp.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel,
      text: cancellation ? "New Cancellation" : "New Subscription!",
      blocks,
    });
    // console.log(response);
    if (response.ok) {
      console.log(
        `${
          cancellation ? "cancellation" : "subscription"
        } message sent to slack ${channel} channel`
      );
      return res.send(response).status(200);
    } else {
      console.log("failed to send message to slack channel due to: ");
      console.log(response.message);
      return res.send(response.message).status(500);
    }
  } catch (error) {
    console.log("failed to send message to slack channel due to: ");
    console.log(error.message);
    return res.send(error.message).status(500);
  }
});

// var Brevo = require('@getbrevo/brevo');
// import Brevo from '@getbrevo/brevo'

// https://developers.brevo.com/reference/sendtransacsms

// var campaignId = 789; // Number | Id of the SMS campaign

// var phoneNumber = new Brevo.SendTestSms(); // SendTestSms | Mobile number of the recipient with the country code. This number must belong to one of your contacts in Brevo account and must not be blacklisted

// send_sms to
app.post("/api/send_sms", async (req, res) => {
  const { recipient, content } = req.body;
  if (!recipient) {
    res.send({ message: "number not found" }).status(500);
  }
  const apiKey = process.env.BREVO_SMS_API_KEY;
  const apiUrl = "https://api.brevo.com/v3/transactionalSMS/sms";

  const smsData = {
    type: "transactional",
    unicodeEnabled: true,
    sender: "GrowYS",
    recipient,
    content,
  };

  try {
    const resp = await axios
      .post(apiUrl, smsData, {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
          Accept: "application/json",
        },
      })
      .then((response) => {
        console.log("SMS sent successfully:", response.data);
        return { success: true, message: "SMS sent successfully" };
      })
      .catch((error) => {
        console.error("Error sending SMS:", error.message);
        return {
          success: false,
          message: `Error sending SMS: ${error.message}`,
          error,
        };
      });
    res.send(resp).status(200);
  } catch (error) {
    console.log("failed to send SMS");
    console.log(error?.message);
    res.send({ message: error?.message || "failed to send SMS" }).status(500);
  }
});

app.get("/api/send_sms_test", async (req, res) => {
  // const username = 'dev_cent';
  // const email = 'paulinnocent05@gmail.com';
  // await sendSMS(`@${username} with email ${email} has just registered for a free trial. \n+15 portions cevapa kod cesma added.`)
  await sendSMS("Testing sms");
  res.send({ success: true, message: "SMS sent successfully" });
});

app.get("/api/send_email_test", async (req, res) => {
  const email = "paulinnocent05@gmail.com";
  const subject = "Test";
  const content = "<b>hello world</b>";

  send_email(email, subject, content);
  res.send({ success: true, message: "Email sent successfully" });
});

app.post("/api/send_email", async (req, res) => {
  send_email(req.body.email, req.body.subject, req.body.htmlContent);
  res.send({ success: true, message: "Email sent successfully" });
});

app.use("/api/stripe", stripeRoutes);

app.get("/", (req, res) => res.send("Hello World!"));

// app.listen(8000, () => console.log('Example app listening on port 8000!'))
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
