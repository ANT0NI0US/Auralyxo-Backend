import { enums } from "../../../../common";
import { buildNewUserEmail, INewUserEmailData } from "./newUser.template";
import { buildOtpEmail, IOtpEmailData, OtpEmailSubject } from "./otp.template";

// each subject comes with its own data → typescript knows the data from the subject
export type EmailTemplateInput =
  | {
      subject: enums.EmailSubjectEnum.NEW_USER_REGISTERED;
      data: INewUserEmailData;
    }
  | {
      subject: OtpEmailSubject;
      data: Omit<IOtpEmailData, "subject">;
    };

export const emailTemplate = (input: EmailTemplateInput) => {
  if (input.subject == enums.EmailSubjectEnum.NEW_USER_REGISTERED) {
    return buildNewUserEmail(input.data);
  }
  return buildOtpEmail({ ...input.data, subject: input.subject });
};
