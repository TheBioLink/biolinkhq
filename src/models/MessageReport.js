import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

const ReportMessageSnapshotSchema = new Schema(
  {
    fromUsername: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    body: { type: String, default: "" },
    createdAt: { type: Date, default: null },
  },
  { _id: false }
);

const MessageReportSchema = new Schema(
  {
    reporterEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    reporterUsername: { type: String, default: "" },
    reportedEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    reportedUsername: { type: String, required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["open", "reviewed", "closed"],
      default: "open",
      index: true,
    },
    messageLog: {
      type: [ReportMessageSnapshotSchema],
      default: [],
    },
    recentMessages: {
      type: [ReportMessageSnapshotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const MessageReport =
  models.MessageReport || model("MessageReport", MessageReportSchema);
