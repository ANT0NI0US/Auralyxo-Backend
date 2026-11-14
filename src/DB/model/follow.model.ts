import mongoose, { HydratedDocument } from "mongoose";
import { enums, itf } from "../../common";
import { numericValues } from "./numericValues";

const followSchema = new mongoose.Schema<itf.IFollow>(
  {
    // the one who follows
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "validation.follower.required"],
    },
    // the one being followed
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "validation.following.required"],
    },
    // ACCEPTED → a real follower, PENDING → a request to a private account
    status: {
      type: Number,
      enum: {
        values: numericValues(enums.FollowStatusEnum),
        message: "validation.followStatus.invalid",
      },
      default: enums.FollowStatusEnum.ACCEPTED,
    },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1, status: 1, createdAt: -1 });
followSchema.index({ follower: 1, status: 1, createdAt: -1 });

export const FollowModel =
  mongoose.models.Follow || mongoose.model<itf.IFollow>("Follow", followSchema);

export type HFollow = HydratedDocument<itf.IFollow>;
