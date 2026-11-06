import { EventEmitter } from "node:events";
import { enums, sendEmail } from "../../common";

export const emailEvent = new EventEmitter();

emailEvent.on(
  enums.EventsEnum.SEND_EMAIL,
  async ({
    recipient,
    subject = enums.EmailSubjectEnum.CONFIRM_EMAIL,
    data,
  }: {
    recipient: {
      to?: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
    };
    subject?: enums.EmailSubjectEnum;
    data: { lang: enums.LanguageEnum; code: number; expiresIn: number };
  }) => {
    try {
      await sendEmail.sendEmail({
        ...recipient,
        subject,
        html: sendEmail.emailTemplate({ subject, data }),
      });
    } catch (error) {
      console.log(`Failed to send email`, error);
    }
  },
);
