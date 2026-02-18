import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/libs/cloudinary";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileBase64, type } = await req.json(); // type: "avatar" | "banner"
  if (!fileBase64) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "biolinkhq";
  const safe = session.user.email.replace(/[^a-z0-9]/gi, "_");
  const public_id = `${safe}_${type}_${Date.now()}`;

  try {
    const upload = await cloudinary.uploader.upload(fileBase64, {
      folder,
      public_id,
      resource_type: "image",
      transformation:
        type === "banner"
          ? [{ width: 1600, height: 600, crop: "fill" }]
          : [{ width: 512, height: 512, crop: "fill" }],
    });

    return NextResponse.json({ ok: true, url: upload.secure_url });
  } catch (e) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
