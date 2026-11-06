"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFields = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const common_1 = require("../common");
const config_service_1 = __importDefault(require("../config.service"));
const EMAIL_REGEX = /^(?=.*[a-zA-Z]{5,25})(?=.*\d{0,5}).{1,30}@(gmail|yahoo|icloud)(\.com|\.net){1,2}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\s{0,})(?=.*[!@#$%^&*()_+\-=|";:<>?]).+$/;
const OTP_REGEX = /^\d{6}$/;
const checkEquality = ({ original, copy, data, ctx, lang, messageKey, }) => {
    if (data[original] != data[copy]) {
        ctx.addIssue({
            code: "custom",
            path: [copy],
            message: (0, common_1.translate)(lang, messageKey),
        });
    }
};
const generalValidationFields = (lang) => ({
    email: zod_1.z.email({
        pattern: EMAIL_REGEX,
        error: (0, common_1.translate)(lang, "validation.email.invalid"),
    }),
    password: zod_1.z
        .string()
        .regex(PASSWORD_REGEX, {
        error: (0, common_1.translate)(lang, "validation.password.weak"),
    })
        .min(8, { error: (0, common_1.translate)(lang, "validation.password.min") })
        .max(16, { error: (0, common_1.translate)(lang, "validation.password.max") }),
    username: zod_1.z
        .string()
        .min(2, { error: (0, common_1.translate)(lang, "validation.username.min") }),
    firstName: zod_1.z
        .string()
        .min(2, { error: (0, common_1.translate)(lang, "validation.firstName.min") })
        .max(30, { error: (0, common_1.translate)(lang, "validation.firstName.max") }),
    lastName: zod_1.z
        .string()
        .min(2, { error: (0, common_1.translate)(lang, "validation.lastName.min") })
        .max(30, { error: (0, common_1.translate)(lang, "validation.lastName.max") }),
    phone: zod_1.z.e164({ error: (0, common_1.translate)(lang, "validation.phone.invalid") }),
    DOB: zod_1.z.coerce.date({ error: (0, common_1.translate)(lang, "validation.DOB.invalid") }),
    gender: zod_1.z.enum(common_1.enums.GenderEnum, {
        error: (0, common_1.translate)(lang, "validation.gender.invalid"),
    }),
    id: zod_1.z.string().refine((value) => mongoose_1.Types.ObjectId.isValid(value), {
        error: (0, common_1.translate)(lang, "validation.userId.invalid"),
    }),
    otp: zod_1.z
        .string()
        .regex(OTP_REGEX, { error: (0, common_1.translate)(lang, "validation.otp.invalid") }),
    jwt: zod_1.z.string().jwt({ alg: "HS256" }),
    file: zod_1.z.strictObject({
        fieldname: zod_1.z.string(),
        originalname: zod_1.z.string(),
        encoding: zod_1.z.string(),
        mimetype: zod_1.z.string(),
        buffer: zod_1.z.instanceof(Buffer),
        size: zod_1.z.number(),
        path: zod_1.z.string(),
    }, { error: (0, common_1.translate)(lang, "validation.file.invalid") }),
    page: zod_1.z.coerce
        .number()
        .min(1, { error: (0, common_1.translate)(lang, "validation.page.min") })
        .default(config_service_1.default.PAGE),
    limit: zod_1.z.coerce
        .number()
        .min(1, { error: (0, common_1.translate)(lang, "validation.limit.min") })
        .default(config_service_1.default.PAGINATION_LIMIT),
    messageContent: zod_1.z
        .string()
        .min(2, { error: (0, common_1.translate)(lang, "validation.content.min") })
        .max(50000, { error: (0, common_1.translate)(lang, "validation.content.max") }),
    checkEquality,
});
exports.generalValidationFields = generalValidationFields;
