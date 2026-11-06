"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplate = void 0;
const common_1 = require("../../../common");
const config_service_1 = __importDefault(require("../../../config.service"));
const titleKeyBySubject = {
    [common_1.enums.EmailSubjectEnum.CONFIRM_EMAIL]: "emailTemplate.confirmEmailTitle",
    [common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION]: "emailTemplate.twoStepVerificationTitle",
    [common_1.enums.EmailSubjectEnum.FORGOT_PASSWORD]: "emailTemplate.forgotPasswordTitle",
};
const buildOtpEmail = ({ lang, subject, code, expiresIn, }) => {
    const dir = lang === common_1.enums.LanguageEnum.AR ? "rtl" : "ltr";
    const title = (0, common_1.translate)(lang, titleKeyBySubject[subject]);
    const expiresInText = (0, common_1.translate)(lang, "emailTemplate.expiresIn").replace("{minutes}", `<b>${expiresIn}</b>`);
    return `<!DOCTYPE html>
                <html dir="${dir}">
                <head>
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
                <style type="text/css">
                body{background-color: #F3F4F6;margin: 0px;font-family: 'Courier New', Courier, monospace;}
                </style>
                <body style="margin:0px;">
                <table border="0" width="50%" style="margin:auto;padding:0;background-color: #fff;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
                <tr>
                <td style="background-color:#0F172A;padding:24px 0;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;">${config_service_1.default.APPLICATION_NAME}</h1>
                </td>
                </tr>
                <tr>
                <td>
                <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
                <tr>
                <td style="padding:40px 40px 0 40px;">
                <h2 style="margin:0;color:#111827;font-size:22px;">${title}</h2>
                <p style="margin:12px 0 0 0;color:#6B7280;font-size:14px;">${(0, common_1.translate)(lang, "emailTemplate.yourOtp")}</p>
                </td>
                </tr>
                <tr>
                <td style="padding:24px 40px 0 40px;">
                <p style="margin:0;background-color:#F3F4F6;border-radius:6px;padding:18px 20px;color:#111827;font-size:28px;font-weight:bold;letter-spacing:10px;">${code}</p>
                </td>
                </tr>
                <tr>
                <td style="padding:20px 40px 0 40px;">
                <p style="margin:0;color:#374151;font-size:14px;">${expiresInText}</p>
                </td>
                </tr>
                <tr>
                <td style="padding:16px 40px 40px 40px;">
                <p style="margin:0;color:#9CA3AF;font-size:13px;">${(0, common_1.translate)(lang, "emailTemplate.disclaimer")}</p>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                <tr>
                <td>
                <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
                <tr>
                <td>
                <h3 style="margin-top:5px; color:#000">${(0, common_1.translate)(lang, "emailTemplate.stayInTouch")}</h3>
                </td>
                </tr>
                <tr>
                <td>
                <div style="margin-top:10px;">

                <a href="${config_service_1.default.FACEBOOK}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
                <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>

                <a href="${config_service_1.default.INSTAGRAM}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
                <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
                </a>

                <a href="${config_service_1.default.TWITTER}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
                <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
                </a>

                </div>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </body>
                </html>`;
};
const emailTemplate = ({ subject, data, }) => {
    return buildOtpEmail({ ...data, subject });
};
exports.emailTemplate = emailTemplate;
