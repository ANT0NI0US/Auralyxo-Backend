import type { enums, tps } from "../../common";

export interface IFriendRequest {
  senderId: tps.IdType;
  receiverId: tps.IdType;
  status: enums.FriendRequestStatusEnum;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
