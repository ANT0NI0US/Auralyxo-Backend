import type { enums, tps } from "../../common";

export interface IFollow {
  follower: tps.userIdType;
  following: tps.userIdType;
  status: enums.FollowStatusEnum;
  createdAt?: Date;
  updatedAt?: Date;
}
