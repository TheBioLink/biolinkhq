// src/libs/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary environment variables", {
    CLOUDINARY_CLOUD_NAME: !!cloudName,
    CLOUDINARY_API_KEY: !!apiKey,
    CLOUDINARY_API_SECRET: !!apiSecret,
  });
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
