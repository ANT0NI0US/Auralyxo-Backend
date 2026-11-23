import { models } from "..";
import type { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class NotificationRecipientRepository extends DatabaseRepository<itf.INotificationRecipient> {
  constructor() {
    super(models.NotificationRecipientModel);
  }
}
