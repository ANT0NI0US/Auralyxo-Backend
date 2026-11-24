import mongoose, { type HydratedDocument } from "mongoose";
import { enums, type itf } from "../../common";
import { numericValues } from "./numericValues";

const friendRequestSchema = new mongoose.Schema<itf.IFriendRequest>(
  {
    // the one who sends the request
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "validation.senderId.required"],
    },
    // the one who receives the request
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "validation.receiverId.required"],
    },
    // ACCEPTED → an accepted request, PENDING → a request to a private account
    status: {
      type: Number,
      enum: {
        values: numericValues(enums.FriendRequestStatusEnum),
        message: "validation.friendRequestStatus.invalid",
      },
      default: enums.FriendRequestStatusEnum.PENDING,
    },
    note: {
      type: String,
      minLength: [30, "validation.note.min"],
      maxLength: [5000, "validation.note.max"],
    },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
friendRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
friendRequestSchema.index({ senderId: 1, status: 1, createdAt: -1 });

export const FriendRequestModel =
  mongoose.models.FriendRequest ||
  mongoose.model<itf.IFriendRequest>("FriendRequest", friendRequestSchema);

export type HFriendRequest = HydratedDocument<itf.IFriendRequest>;
