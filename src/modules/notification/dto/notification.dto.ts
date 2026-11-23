import z from "zod";
import type * as validators from "../notification.validation";

export type AddNotificationDto = z.infer<
  ReturnType<typeof validators.addNotification>
>;
export type GetAllNotificationsDto = z.infer<
  ReturnType<typeof validators.getAllNotifications>
>;
export type NotificationRecipientsDto = z.infer<
  ReturnType<typeof validators.notificationRecipients>
>;
export type DeleteNotificationDto = z.infer<
  ReturnType<typeof validators.deleteNotification>
>;
export type SeenOneNotificationDto = z.infer<
  ReturnType<typeof validators.seenOneNotification>
>;
