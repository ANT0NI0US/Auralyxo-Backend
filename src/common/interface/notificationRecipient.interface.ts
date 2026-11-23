import type { tps } from "../../common";

export interface INotificationRecipient {
  notification: tps.IdType;
  user: tps.IdType;
  seenAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
