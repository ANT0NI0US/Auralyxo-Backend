import nodemailer, { Attachment } from "nodemailer";
import { enums, events, exceptions, security, services } from "../../../common";
import configService from "../../../config.service";
import { transporter } from "./email.config";
import { createOtp } from "./otp";

interface IUserEmail {
  email: string;
  subject: enums.EmailSubjectEnum;
}

export const UserEmailKey = ({ email, subject }: IUserEmail): string => {
  return `User::${email}::${subject}_OTP`;
};

export const UserOtpTrialsKey = ({ email, subject }: IUserEmail): string => {
  return `${UserEmailKey({ email, subject })}::Trials`;
};

export const UserOtpAttemptsKey = ({ email, subject }: IUserEmail): string => {
  return `${UserEmailKey({ email, subject })}::Attempts`;
};

export async function sendEmail({
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments = [],
}: {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: enums.EmailSubjectEnum;
  text?: string;
  html?: string;
  attachments?: Attachment[];
}) {
  try {
    if (!to?.length && !cc?.length && !bcc?.length) {
      throw new exceptions.BadRequestException("error.invalidRecipient");
    }
    if (!text?.length && !html?.length && !attachments?.length) {
      throw new exceptions.BadRequestException("error.invalidEmailContent");
    }

    const info = await transporter.sendMail({
      from: `"${configService.APPLICATION_NAME}" <${configService.APP_EMAIL}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    });

    console.info("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
}

export const checkOTP = async ({
  email,
  otp,
  subject = enums.EmailSubjectEnum.CONFIRM_EMAIL,
  maxAttempts = configService.MAX_OTP_ATTEMPTS,
}: {
  email: string;
  otp: string;
  subject: enums.EmailSubjectEnum;
  maxAttempts?: number;
}) => {
  const otpKey = UserEmailKey({ email, subject });
  const attemptsKey = UserOtpAttemptsKey({ email, subject });

  const hashOtp = await services.cacheService.get({ key: otpKey });

  if (!hashOtp) {
    throw new exceptions.BadRequestException("error.invalidOtp");
  }

  const attempts = await services.cacheService.incrBy({ key: attemptsKey });

  if (attempts == 1) {
    const otpTTL = await services.cacheService.ttl({ key: otpKey });
    await services.cacheService.expire({
      key: attemptsKey,
      ttl: Math.max(otpTTL, 1),
    });
  }

  if (attempts > maxAttempts) {
    await services.cacheService.del({ key: [otpKey, attemptsKey] });
    throw new exceptions.TooManyRequestException("error.otpAttemptsExceeded");
  }

  if (!(await security.compare({ plainText: otp, cipherText: hashOtp }))) {
    throw new exceptions.BadRequestException("error.invalidOtp");
  }

  await services.cacheService.del({ key: attemptsKey });
};

export const sendEmailOtp = async ({
  email,
  subject = enums.EmailSubjectEnum.CONFIRM_EMAIL,
  lang,
  maxTrials = configService.MAX_OTP_TRIALS,
  otpExpiresTime = configService.OTP_EXPIRES_TIME,
  blockOtpTime = configService.BLOCK_OTP_TIME,
}: {
  email: string;
  subject?: enums.EmailSubjectEnum;
  lang: enums.LanguageEnum;
  maxTrials?: number;
  otpExpiresTime?: number;
  blockOtpTime?: number;
}) => {
  const existOtpTTL = await services.cacheService.ttl({
    key: UserEmailKey({ email, subject }),
  });

  if (existOtpTTL > 0) {
    throw new exceptions.ConflictException("error.otpStillValid");
  }

  const currentTrials =
    (await services.cacheService.get({
      key: UserOtpTrialsKey({ email, subject }),
    })) ?? 0;

  if (currentTrials >= maxTrials) {
    throw new exceptions.TooManyRequestException("error.otpLimitReached");
  }

  const otp = createOtp();

  await services.cacheService.set({
    key: UserEmailKey({ email, subject }),
    value: await security.hash({ plainText: otp.toString() }),
    ttl: otpExpiresTime,
  });

  const finalTrials = await services.cacheService.incrBy({
    key: UserOtpTrialsKey({ email, subject }),
  });

  if (finalTrials == 1 || finalTrials == maxTrials) {
    await services.cacheService.expire({
      key: UserOtpTrialsKey({ email, subject }),
      ttl: blockOtpTime,
    });
  }

  events.emailEvent.emit(enums.EventsEnum.SEND_EMAIL, {
    recipient: { to: email },
    subject,
    data: { code: otp, lang, expiresIn: Math.ceil(otpExpiresTime / 60) },
  });
};
