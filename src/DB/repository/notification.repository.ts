import { models } from "..";
import type { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class NotificationRepository extends DatabaseRepository<itf.INotification> {
  constructor() {
    super(models.NotificationModel);
  }
}
