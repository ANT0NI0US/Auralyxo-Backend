"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.resetPassword = exports.verifyForgotPasswordCode = exports.requestForgetPasswordCode = exports.reSendConfirmEmail = exports.confirmTwoStepVerification = exports.loginConfirmation = exports.confirmEmail = exports.confirmEmailSchema = exports.signup = exports.login = exports.loginSchema = exports.signupLoginWithGmail = void 0;
const zod_1 = require("zod");
const common_1 = require("../../common");
const validation_1 = require("../../common/validation");
const signupLoginWithGmail = (lang) => {
    return zod_1.z.object({
        body: zod_1.z.strictObject({
            idToken: zod_1.z.jwt({
                alg: "RS256",
                error: (0, common_1.translate)(lang, "validation.idToken.invalid"),
            }),
        }),
    });
};
exports.signupLoginWithGmail = signupLoginWithGmail;
const loginSchema = (lang) => {
    return zod_1.z.strictObject({
        email: (0, validation_1.generalValidationFields)(lang).email,
        password: (0, validation_1.generalValidationFields)(lang).password,
    });
};
exports.loginSchema = loginSchema;
const login = (lang) => {
    return zod_1.z.object({
        body: (0, exports.loginSchema)(lang),
    });
};
exports.login = login;
const signup = (lang) => {
    return zod_1.z.object({
        body: (0, exports.loginSchema)(lang)
            .safeExtend({
            username: (0, validation_1.generalValidationFields)(lang).username,
            phone: (0, validation_1.generalValidationFields)(lang).phone,
            confirmPassword: (0, validation_1.generalValidationFields)(lang).password,
            DOB: (0, validation_1.generalValidationFields)(lang).DOB,
            gender: (0, validation_1.generalValidationFields)(lang).gender,
        })
            .superRefine((data, ctx) => {
            (0, validation_1.generalValidationFields)(lang).checkEquality({
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
                    message: (0, common_1.translate)(lang, "validation.username.twoParts"),
                });
            }
        }),
    });
};
exports.signup = signup;
const confirmEmailSchema = (lang) => {
    return zod_1.z.strictObject({
        email: (0, validation_1.generalValidationFields)(lang).email,
        otp: (0, validation_1.generalValidationFields)(lang).otp,
    });
};
exports.confirmEmailSchema = confirmEmailSchema;
const confirmEmail = (lang) => {
    return zod_1.z.object({
        body: (0, exports.confirmEmailSchema)(lang),
    });
};
exports.confirmEmail = confirmEmail;
const loginConfirmation = (lang) => {
    return zod_1.z.object({
        body: (0, exports.confirmEmailSchema)(lang),
    });
};
exports.loginConfirmation = loginConfirmation;
const confirmTwoStepVerification = (lang) => {
    return zod_1.z.object({
        body: zod_1.z.strictObject({
            otp: (0, validation_1.generalValidationFields)(lang).otp,
        }),
    });
};
exports.confirmTwoStepVerification = confirmTwoStepVerification;
const reSendConfirmEmail = (lang) => {
    return zod_1.z.object({
        body: zod_1.z.strictObject({
            email: (0, validation_1.generalValidationFields)(lang).email,
        }),
    });
};
exports.reSendConfirmEmail = reSendConfirmEmail;
const requestForgetPasswordCode = (lang) => {
    return zod_1.z.object({
        body: zod_1.z.strictObject({
            email: (0, validation_1.generalValidationFields)(lang).email,
        }),
    });
};
exports.requestForgetPasswordCode = requestForgetPasswordCode;
const verifyForgotPasswordCode = (lang) => {
    return zod_1.z.object({
        body: (0, exports.confirmEmailSchema)(lang),
    });
};
exports.verifyForgotPasswordCode = verifyForgotPasswordCode;
const resetPassword = (lang) => {
    return zod_1.z.object({
        body: (0, exports.confirmEmailSchema)(lang)
            .safeExtend({
            password: (0, validation_1.generalValidationFields)(lang).password,
            confirmPassword: (0, validation_1.generalValidationFields)(lang).password,
        })
            .superRefine((data, ctx) => {
            (0, validation_1.generalValidationFields)(lang).checkEquality({
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
exports.resetPassword = resetPassword;
const logout = (lang) => {
    return zod_1.z.object({
        body: zod_1.z.strictObject({
            action: zod_1.z.enum(common_1.enums.LogoutEnum).default(common_1.enums.LogoutEnum.DEVICE),
        }),
    });
};
exports.logout = logout;
