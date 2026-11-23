import mongoose, { type HydratedDocument } from "mongoose";
import { type itf } from "../../common";

const notificationRecipientSchema =
  new mongoose.Schema<itf.INotificationRecipient>(
    {
      notification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
        required: [true, "validation.notification.required"],
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "validation.recipient.required"],
      },
      seenAt: Date,
    },
    { timestamps: true, strict: true, strictQuery: true },
  );

notificationRecipientSchema.index(
  { notification: 1, user: 1 },
  { unique: true },
);
notificationRecipientSchema.index({ user: 1, createdAt: -1 });

export const NotificationRecipientModel =
  mongoose.models.NotificationRecipient ||
  mongoose.model<itf.INotificationRecipient>(
    "NotificationRecipient",
    notificationRecipientSchema,
  );

export type HNotificationRecipient =
  HydratedDocument<itf.INotificationRecipient>;
