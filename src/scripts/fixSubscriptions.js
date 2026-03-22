// scripts/fixSubscriptions.js

import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { computeSubscriptionStatus } from "../src/libs/subscriptionStatus.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find();

  for (const user of users) {
    const status = computeSubscriptionStatus(user);

    if (user.subscription.status !== status) {
      user.subscription.status = status;
      await user.save();

      console.log(`Fixed ${user.email}: ${status}`);
    }
  }

  process.exit();
}

run();
