import mongoose from "mongoose";
import { enums } from "../../common";

export interface IFollow {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  status: enums.FollowStatusEnum;
  createdAt?: Date;
  updatedAt?: Date;
}
