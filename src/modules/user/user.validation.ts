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

export const getUser = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
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

export const coverImages = (lang: enums.LanguageEnum) => {
  return z.object({
    files: z.array(generalValidationFields(lang).file).min(1).max(5),
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

export const toggleVisibility = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z.strictObject({
      visibility: z.enum(enums.AccountVisibilityEnum, {
        error: translate(lang, "validation.visibility.invalid"),
      }),
    }),
  });
};

// Follow / Unfollow
export const followAccount = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};

export const unFollowAccount = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};

export const getFollowers = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
    }),
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};

export const getFollowings = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
    }),
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};

export const getFollowRequests = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
    }),
  });
};

export const takeAnActionToRequest = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
    body: z.strictObject({
      action: z.enum(enums.FollowRequestActionEnum, {
        error: translate(lang, "validation.followRequestAction.invalid"),
      }),
    }),
  });
};

export const searchUsers = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      search: z
        .string({ error: translate(lang, "validation.search.required") })
        .trim()
        .min(1, { error: translate(lang, "validation.search.required") })
        .max(50, { error: translate(lang, "validation.search.max") }),
      page: generalValidationFields(lang).page,
      limit: generalValidationFields(lang).limit,
    }),
  });
};

export const getSuggestions = (lang: enums.LanguageEnum) => {
  return z.object({
    query: z.strictObject({
      limit: generalValidationFields(lang).limit,
    }),
  });
};

export const removeExistingFollower = (lang: enums.LanguageEnum) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};
