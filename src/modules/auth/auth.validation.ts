import { z } from "zod";
import { enums, translate } from "../../common";
import { generalValidationFields } from "../../common/validation";

export const signupLoginWithGmail = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z.strictObject({
      idToken: z.jwt({
        alg: "RS256",
        error: translate(lang, "validation.idToken.invalid"),
      }),
    }),
  });
};

export const loginSchema = (lang: enums.LanguageEnum) => {
  return z.strictObject({
    email: generalValidationFields(lang).email,
    password: generalValidationFields(lang).password,
  });
};

export const login = (lang: enums.LanguageEnum) => {
  return z.object({
    body: loginSchema(lang),
  });
};

export const signup = (lang: enums.LanguageEnum) => {
  return z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: generalValidationFields(lang).username,
        phone: generalValidationFields(lang).phone,
        confirmPassword: generalValidationFields(lang).password,
        DOB: generalValidationFields(lang).DOB,
        gender: generalValidationFields(lang).gender,
      })
      .superRefine((data, ctx) => {
        generalValidationFields(lang).checkEquality({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
          messageKey: "validation.password.mismatch",
        });
        if (!data.username.includes(" ")) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message: translate(lang, "validation.username.twoParts"),
          });
        }
      }),
  });
};

export const confirmEmailSchema = (lang: enums.LanguageEnum) => {
  return z.strictObject({
    email: generalValidationFields(lang).email,
    otp: generalValidationFields(lang).otp,
  });
};

export const confirmEmail = (lang: enums.LanguageEnum) => {
  return z.object({
    body: confirmEmailSchema(lang),
  });
};

export const loginConfirmation = (lang: enums.LanguageEnum) => {
  return z.object({
    body: confirmEmailSchema(lang),
  });
};

export const confirmTwoStepVerification = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z.strictObject({
      otp: generalValidationFields(lang).otp,
    }),
  });
};

export const reSendConfirmEmail = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z.strictObject({
      email: generalValidationFields(lang).email,
    }),
  });
};

export const requestForgetPasswordCode = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z.strictObject({
      email: generalValidationFields(lang).email,
    }),
  });
};

export const verifyForgotPasswordCode = (lang: enums.LanguageEnum) => {
  return z.object({
    body: confirmEmailSchema(lang),
  });
};

export const resetPassword = (lang: enums.LanguageEnum) => {
  return z.object({
    body: confirmEmailSchema(lang)
      .safeExtend({
        password: generalValidationFields(lang).password,
        confirmPassword: generalValidationFields(lang).password,
      })
      .superRefine((data, ctx) => {
        generalValidationFields(lang).checkEquality({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
          messageKey: "validation.password.mismatch",
        });
      }),
  });
};

export const logout = (lang: enums.LanguageEnum) => {
  return z.object({
    body: z
      .strictObject({
        action: z.enum(enums.LogoutEnum).default(enums.LogoutEnum.DEVICE),
      })
      .prefault({}),
  });
};
