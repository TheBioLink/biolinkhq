import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  await mongoose.connect(process.env.MONGO_URI);

  await Page.updateOne(
    { owner: session.user.email },
    {
      $set: {
        bgType: data.bgType,
        bgImage: data.bgImage,
        bgColor: data.bgColor,
      },
    }
  );

  return Response.json({ ok: true });
}
