// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/libs/cloudinary";

function hasCloudinaryConfig() {
  return (
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET
  );
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasCloudinaryConfig()) {
      return NextResponse.json(
        {
          error: "Missing Cloudinary env vars",
          missing: {
            CLOUDINARY_CLOUD_NAME: !process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: !process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: !process.env.CLOUDINARY_API_SECRET,
          },
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { fileBase64, type } = body || {};

    if (!fileBase64) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (type !== "avatar" && type !== "banner") {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "biolinkhq";
    const safeEmail = String(session.user.email).replace(/[^a-z0-9]/gi, "_");
    const publicId = `${safeEmail}_${type}_${Date.now()}`;

    const upload = await cloudinary.uploader.upload(fileBase64, {
      folder,
      public_id: publicId,
      resource_type: "image",
      transformation:
        type === "banner"
          ? [{ width: 1600, height: 600, crop: "fill" }]
          : [{ width: 512, height: 512, crop: "fill" }],
    });

    return NextResponse.json({
      ok: true,
      url: upload.secure_url,
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    return NextResponse.json(
      {
        error: "Upload failed",
        details:
          error?.message || "Unknown Cloudinary upload error",
      },
      { status: 500 }
    );
  }
}
