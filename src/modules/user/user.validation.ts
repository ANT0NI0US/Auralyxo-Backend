import { z } from "zod";
import { enums, translate } from "../../common";
import { generalValidationFields } from "../../common/validation";

export const getAllUsers = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
      type: z.coerce
        .number()
        .pipe(
          z.enum(enums.UsersByAccountStatusEnum, {
            error: translate(lang, "validation.accountStatusType.invalid"),
          }),
        )
        .default(enums.UsersByAccountStatusEnum.ALL),
    }),
  });
};

export const update = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z.strictObject({
      firstName: z
        .string()
        .min(2, { error: translate(lang, "validation.firstName.min") })
        .max(30, { error: translate(lang, "validation.firstName.max") })
        .optional(),
      lastName: z
        .string()
        .min(2, { error: translate(lang, "validation.lastName.min") })
        .max(30, { error: translate(lang, "validation.lastName.max") })
        .optional(),
      phone: generalValidationFields(lang).phone.optional(),
      DOB: generalValidationFields(lang).DOB.optional(),
      gender: generalValidationFields(lang).gender.optional(),
    }),
  });
};

export const shareProfile = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};

export const profileImage = (lang: enums.LanguageEnum) => {
  return z.object({
    file: generalValidationFields(lang).file,
  });
};

export const toggleAccountStatus = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
    body: z.strictObject({
      status: z.enum(enums.AccountStatusEnum, {
        error: translate(lang, "validation.status.invalid"),
      }),
    }),
  });
};

export const deleteUser = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};
