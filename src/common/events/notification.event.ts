import { EventEmitter } from "node:events";
import { enums, type itf } from "../../common";
import { notificationService } from "../services";

export const notificationEvent = new EventEmitter();

notificationEvent.on(
  enums.EventsEnum.SEND_NOTIFICATION,
  async ({ recipients, notificationData }: itf.INotificationEventPayload) => {
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        const lang =
          recipient.preferredLanguage == enums.LanguageEnum.EN ? "en" : "ar";

        const tokens = await notificationService.getFCMs({
          userId: recipient._id,
        });

        await notificationService.sendNotifications({
          tokens,
          title: notificationData.title[lang],
          body: notificationData.body[lang],
        });
      }),
    );

    const failed = results.filter((r) => r.status == "rejected").length;
    if (failed) console.error(`Failed to send notification to ${failed} users`);
  },
);
