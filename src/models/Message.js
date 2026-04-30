import mongoose from "mongoose";
import { messageDb } from "@/libs/messageDb";

let MessageModel;

export async function getMessageModel() {
  const conn = await messageDb();

  if (!MessageModel) {
    const MessageSchema = new mongoose.Schema(
      {
        fromEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
        toEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
        body: { type: String, required: true, trim: true, maxlength: 1000 },
        readAt: { type: Date, default: null },
        editedAt: { type: Date, default: null },
        deleted: { type: Boolean, default: false },
      },
      { timestamps: true }
    );

    MessageSchema.index({ fromEmail: 1, toEmail: 1, createdAt: -1 });
    MessageSchema.index({ toEmail: 1, readAt: 1, createdAt: -1 });

    MessageModel = conn.models.Message || conn.model("Message", MessageSchema);
  }

  return MessageModel;
}
