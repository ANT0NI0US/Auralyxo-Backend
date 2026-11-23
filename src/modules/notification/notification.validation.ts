import { Types } from "mongoose";
import { z } from "zod";
import { enums, translate } from "../../common";
import { generalValidationFields } from "../../common/validation";

const notificationId = (lang: enums.LanguageEnum) =>
  z.string().refine((value) => Types.ObjectId.isValid(value), {
    error: translate(lang, "validation.notificationId.invalid"),
  });

export const addNotification = (lang: enums.LanguageEnum) => {
  const title = z
    .string({ error: translate(lang, "validation.notificationTitle.required") })
    .min(10, { error: translate(lang, "validation.notificationTitle.min") })
    .max(50, { error: translate(lang, "validation.notificationTitle.max") });

  const body = z
    .string({ error: translate(lang, "validation.notificationBody.required") })
    .min(30, { error: translate(lang, "validation.notificationBody.min") })
    .max(200, { error: translate(lang, "validation.notificationBody.max") });

  return z.object({
    body: z.strictObject({
      title: z.strictObject(
        { ar: title, en: title },
        { error: translate(lang, "validation.notificationTitle.required") },
      ),
      body: z.strictObject(
        { ar: body, en: body },
        { error: translate(lang, "validation.notificationBody.required") },
      ),
    }),
  });
};

export const getAllNotifications = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
    }),
  });
};

export const notificationRecipients = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({ notificationId: notificationId(lang) }),
    query: z.strictObject({
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
      // no seen → everyone, true → who saw it, false → who didn't
      seen: z
        .enum(["true", "false"], {
          error: translate(lang, "validation.seen.invalid"),
        })
        .optional(),
    }),
  });
};

export const deleteNotification = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      notificationId: notificationId(lang),
    }),
  });
};

export const seenOneNotification = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      notificationId: notificationId(lang),
    }),
  });
};
