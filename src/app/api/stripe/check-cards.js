import stripe from "@/libs/stripe";
import mongoose from "mongoose";
import { User } from "@/models/User";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) return new Response(JSON.stringify({ hasPaymentMethod: false }), { status: 200 });

    await connectDB();
    const user = await User.findOne({ email });
    const hasCard = user?.hasPaymentMethod || false;

    return new Response(JSON.stringify({ hasPaymentMethod: hasCard }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ hasPaymentMethod: false }), { status: 500 });
  }
}
