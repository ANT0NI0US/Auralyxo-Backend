import { EventEmitter } from "node:events";
import { enums, sendEmail } from "../../common";

export const emailEvent = new EventEmitter();

emailEvent.on(
  enums.EventsEnum.SEND_EMAIL,
  async ({
    recipient,
    ...template
  }: {
    recipient: {
      to?: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
    };
  } & sendEmail.EmailTemplateInput) => {
    try {
      await sendEmail.sendEmail({
        ...recipient,
        subject: template.subject,
        html: sendEmail.emailTemplate(template),
      });
    } catch (error) {
      console.error(`Failed to send email`, error);
    }
  },
);
