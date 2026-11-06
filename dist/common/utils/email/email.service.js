"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailOtp = exports.checkOTP = exports.UserOtpTrialsKey = exports.UserEmailKey = void 0;
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const common_1 = require("../../../common");
const config_service_1 = __importDefault(require("../../../config.service"));
const email_config_1 = require("./email.config");
const otp_1 = require("./otp");
const UserEmailKey = ({ email, subject }) => {
    return `User::${email}::${subject}_OTP`;
};
exports.UserEmailKey = UserEmailKey;
const UserOtpTrialsKey = ({ email, subject }) => {
    return `${(0, exports.UserEmailKey)({ email, subject })}::Trials`;
};
exports.UserOtpTrialsKey = UserOtpTrialsKey;
async function sendEmail({ to, cc, bcc, subject, text, html, attachments = [], }) {
    try {
        if (!to?.length && !cc?.length && !bcc?.length) {
            throw new common_1.exceptions.BadRequestException("error.invalidRecipient");
        }
        if (!text?.length && !html?.length && !attachments?.length) {
            throw new common_1.exceptions.BadRequestException("error.invalidEmailContent");
        }
        const info = await email_config_1.transporter.sendMail({
            from: `"${config_service_1.default.APPLICATION_NAME}" <${config_service_1.default.APP_EMAIL}>`,
            to,
            cc,
            bcc,
            subject,
            text,
            html,
            attachments,
        });
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
    }
    catch (err) {
        console.error("Error while sending mail:", err);
    }
}
const checkOTP = async ({ email, otp, subject = common_1.enums.EmailSubjectEnum.CONFIRM_EMAIL, }) => {
    const hashOtp = await common_1.services.cacheService.get({
        key: (0, exports.UserEmailKey)({ email, subject }),
    });
    if (!hashOtp ||
        !(await common_1.security.compare({ plainText: otp, cipherText: hashOtp }))) {
        throw new common_1.exceptions.BadRequestException("error.invalidOtp");
    }
};
exports.checkOTP = checkOTP;
const sendEmailOtp = async ({ email, subject = common_1.enums.EmailSubjectEnum.CONFIRM_EMAIL, lang, maxTrials = config_service_1.default.MAX_OTP_TRIALS, otpExpiresTime = config_service_1.default.OTP_EXPIRES_TIME, blockOtpTime = config_service_1.default.BLOCK_OTP_TIME, }) => {
    const existOtpTTL = await common_1.services.cacheService.ttl({
        key: (0, exports.UserEmailKey)({ email, subject }),
    });
    if (existOtpTTL > 0) {
        throw new common_1.exceptions.ConflictException("error.otpStillValid");
    }
    const currentTrials = (await common_1.services.cacheService.get({
        key: (0, exports.UserOtpTrialsKey)({ email, subject }),
    })) ?? 0;
    if (currentTrials >= maxTrials) {
        throw new common_1.exceptions.TooManyRequestException("error.otpLimitReached");
    }
    const otp = (0, otp_1.createOtp)();
    await common_1.services.cacheService.set({
        key: (0, exports.UserEmailKey)({ email, subject }),
        value: await common_1.security.hash({ plainText: otp.toString() }),
        ttl: otpExpiresTime,
    });
    const finalTrials = await common_1.services.cacheService.incrBy({
        key: (0, exports.UserOtpTrialsKey)({ email, subject }),
    });
    if (finalTrials == maxTrials) {
        await common_1.services.cacheService.expire({
            key: (0, exports.UserOtpTrialsKey)({ email, subject }),
            ttl: blockOtpTime,
        });
    }
    common_1.events.emailEvent.emit(common_1.enums.EventsEnum.SEND_EMAIL, {
        recipient: { to: email },
        subject,
        data: { code: otp, lang, expiresIn: Math.ceil(otpExpiresTime / 60) },
    });
};
exports.sendEmailOtp = sendEmailOtp;
