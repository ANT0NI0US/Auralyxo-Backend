import mongoose, { type HydratedDocument } from "mongoose";
import { type itf } from "../../common";

const notificationSchema = new mongoose.Schema<itf.INotification>(
  {
    title: {
      ar: {
        type: String,
        required: [true, "validation.notificationTitle.required"],
        minLength: [10, "validation.notificationTitle.min"],
        maxLength: [50, "validation.notificationTitle.max"],
      },
      en: {
        type: String,
        required: [true, "validation.notificationTitle.required"],
        minLength: [10, "validation.notificationTitle.min"],
        maxLength: [50, "validation.notificationTitle.max"],
      },
    },
    body: {
      ar: {
        type: String,
        required: [true, "validation.notificationBody.required"],
        minLength: [30, "validation.notificationBody.min"],
        maxLength: [200, "validation.notificationBody.max"],
      },
      en: {
        type: String,
        required: [true, "validation.notificationBody.required"],
        minLength: [30, "validation.notificationBody.min"],
        maxLength: [200, "validation.notificationBody.max"],
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "validation.createdBy.required"],
    },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<itf.INotification>("Notification", notificationSchema);

export type HNotification = HydratedDocument<itf.INotification>;
