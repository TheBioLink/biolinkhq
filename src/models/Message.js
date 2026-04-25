import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

const MessageSchema = new Schema(
  {
    fromEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    toEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 60 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ fromEmail: 1, toEmail: 1, createdAt: -1 });
MessageSchema.index({ toEmail: 1, readAt: 1, createdAt: -1 });

export const Message = models.Message || model("Message", MessageSchema);
