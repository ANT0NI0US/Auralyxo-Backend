"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileImage = exports.shareProfile = exports.update = exports.getAllUsers = void 0;
const zod_1 = require("zod");
const common_1 = require("../../common");
const validation_1 = require("../../common/validation");
const getAllUsers = (lang) => {
    return zod_1.z.object({
        query: zod_1.z.strictObject({
            page: (0, validation_1.generalValidationFields)(lang).page,
            limit: (0, validation_1.generalValidationFields)(lang).limit,
            type: zod_1.z.coerce
                .number()
                .pipe(zod_1.z.enum(common_1.enums.UsersByAccountStatusEnum, {
                error: (0, common_1.translate)(lang, "validation.accountStatusType.invalid"),
            }))
                .default(common_1.enums.UsersByAccountStatusEnum.ALL),
        }),
    });
};
exports.getAllUsers = getAllUsers;
const update = (lang) => {
    return zod_1.z.object({
        body: zod_1.z.strictObject({
            firstName: zod_1.z
                .string()
                .min(2, { error: (0, common_1.translate)(lang, "validation.firstName.min") })
                .max(30, { error: (0, common_1.translate)(lang, "validation.firstName.max") })
                .optional(),
            lastName: zod_1.z
                .string()
                .min(2, { error: (0, common_1.translate)(lang, "validation.lastName.min") })
                .max(30, { error: (0, common_1.translate)(lang, "validation.lastName.max") })
                .optional(),
            phone: (0, validation_1.generalValidationFields)(lang).phone.optional(),
            DOB: (0, validation_1.generalValidationFields)(lang).DOB.optional(),
            gender: (0, validation_1.generalValidationFields)(lang).gender.optional(),
        }),
    });
};
exports.update = update;
const shareProfile = (lang) => {
    return zod_1.z.object({
        params: zod_1.z.strictObject({
            userId: (0, validation_1.generalValidationFields)(lang).id,
        }),
    });
};
exports.shareProfile = shareProfile;
const profileImage = (lang) => {
    return zod_1.z.object({
        file: (0, validation_1.generalValidationFields)(lang).file,
    });
};
exports.profileImage = profileImage;
