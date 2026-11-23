import type { enums, tps } from "../../common";

export interface IFollow {
  follower: tps.IdType;
  following: tps.IdType;
  status: enums.FollowStatusEnum;
  createdAt?: Date;
  updatedAt?: Date;
}
