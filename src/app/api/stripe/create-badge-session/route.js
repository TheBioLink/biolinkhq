import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: session.user.email,

    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: "3 Custom Badges",
          },
          unit_amount: 150,
        },
        quantity: 1,
      },
    ],

    success_url: `${process.env.NEXTAUTH_URL}/account/badges?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/account/badges?cancel=true`,
  });

  return NextResponse.json({ url: checkout.url });
}
