import { Types } from "mongoose";
import { z } from "zod";
import { enums, translate, type TranslationKey } from "../common";
import configService from "../config.service";

const EMAIL_REGEX =
  /^(?=.*[a-zA-Z]{5,25})(?=.*\d{0,5}).{1,30}@(gmail|yahoo|icloud)(\.com|\.net){1,2}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\s{0,})(?=.*[!@#$%^&*()_+\-=|";:<>?]).+$/;

const OTP_REGEX = /^\d{6}$/;

const checkEquality = ({
  original,
  copy,
  data,
  ctx,
  lang,
  messageKey,
}: {
  original: string;
  copy: string;
  data: any;
  ctx: z.RefinementCtx;
  lang: enums.LanguageEnum;
  messageKey: TranslationKey;
}) => {
  if (data[original] != data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: [copy],
      message: translate(lang, messageKey),
    });
  }
};

export const generalValidationFields = (lang: enums.LanguageEnum) => ({
  email: z.email({
    pattern: EMAIL_REGEX,
    error: translate(lang, "validation.email.invalid"),
  }),
  password: z
    .string()
    .regex(PASSWORD_REGEX, {
      error: translate(lang, "validation.password.weak"),
    })
    .min(8, { error: translate(lang, "validation.password.min") })
    .max(16, { error: translate(lang, "validation.password.max") }),
  username: z
    .string()
    .min(2, { error: translate(lang, "validation.username.min") }),
  firstName: z
    .string()
    .min(2, { error: translate(lang, "validation.firstName.min") })
    .max(30, { error: translate(lang, "validation.firstName.max") }),
  lastName: z
    .string()
    .min(2, { error: translate(lang, "validation.lastName.min") })
    .max(30, { error: translate(lang, "validation.lastName.max") }),
  phone: z.e164({ error: translate(lang, "validation.phone.invalid") }),
  DOB: z.coerce.date({ error: translate(lang, "validation.DOB.invalid") }),
  gender: z.enum(enums.GenderEnum, {
    error: translate(lang, "validation.gender.invalid"),
  }),
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    error: translate(lang, "validation.userId.invalid"),
  }),
  otp: z
    .string()
    .regex(OTP_REGEX, { error: translate(lang, "validation.otp.invalid") }),
  jwt: z.string().jwt({ alg: "HS256" }),
  file: z.strictObject(
    {
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string(),
      size: z.number(),
      path: z.string(),
      // only exist with the memory storage
      buffer: z.instanceof(Buffer).optional(),
      // only exist with the disk storage
      destination: z.string().optional(),
      filename: z.string().optional(),
    },
    { error: translate(lang, "validation.file.invalid") },
  ),
  page: z.coerce
    .number()
    .min(1, { error: translate(lang, "validation.page.min") })
    .default(configService.PAGE),
  limit: z.coerce
    .number()
    .min(1, { error: translate(lang, "validation.limit.min") })
    .default(configService.PAGINATION_LIMIT),
  checkEquality,
});
