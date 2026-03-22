import mongoose from "mongoose";
import { User } from "../models/User.js";
import { computeSubscriptionStatus } from "../libs/subscriptionStatus.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to DB");

    const users = await User.find();

    for (const user of users) {
      const status = computeSubscriptionStatus(user);

      if (!user.subscription) {
        user.subscription = {};
      }

      if (user.subscription.status !== status) {
        user.subscription.status = status;
        await user.save();

        console.log(`Fixed ${user.email}: ${status}`);
      }
    }

    console.log("Done fixing subscriptions");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
