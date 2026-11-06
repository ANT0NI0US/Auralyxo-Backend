"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const common_1 = require("../../common");
const middleware = __importStar(require("../../middleware"));
const auth_service_1 = __importDefault(require("./auth.service"));
const validators = __importStar(require("./auth.validation"));
const router = (0, express_1.Router)({ caseSensitive: true, strict: true });
router.post("/signup-with-gmail", middleware.validation(validators.signupLoginWithGmail), middleware.responseFormatter(async (req, res, next) => {
    const { status, ...tokens } = await auth_service_1.default.signupLoginWithGmail({
        body: req.validate.body,
        issuer: common_1.issuer.getIssuer(req),
    });
    return {
        status,
        message: status == 200 ? "success.gmailLogin" : "success.gmailSignup",
        data: tokens,
    };
}));
router.post("/signup", middleware.validation(validators.signup), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.signup({
        body: req.validate.body,
        lang: req.lang,
    });
    return { status: 201, message: "success.signup" };
}));
router.patch("/confirm-email", middleware.validation(validators.confirmEmail), middleware.responseFormatter(async (req, res, next) => {
    const tokens = await auth_service_1.default.confirmEmail({
        body: req.validate.body,
        issuer: common_1.issuer.getIssuer(req),
    });
    return { message: "success.emailConfirmed", data: tokens };
}));
router.patch("/resend-confirm-email", middleware.validation(validators.reSendConfirmEmail), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.reSendConfirmEmail({
        body: req.validate.body,
        lang: req.lang,
    });
    return { message: "success.otpSent" };
}));
router.post("/login", middleware.validation(validators.login), middleware.responseFormatter(async (req, res, next) => {
    const tokens = await auth_service_1.default.login({
        body: req.validate.body,
        issuer: common_1.issuer.getIssuer(req),
        lang: req.lang,
    });
    return {
        message: tokens ? "success.login" : "success.otpSent",
        data: tokens,
    };
}));
router.patch("/login-confirmation", middleware.validation(validators.loginConfirmation), middleware.responseFormatter(async (req, res, next) => {
    const tokens = await auth_service_1.default.loginConfirmation({
        body: req.validate.body,
        issuer: common_1.issuer.getIssuer(req),
    });
    return { message: "success.login", data: tokens };
}));
router.post("/enable-two-step-verification", middleware.authentication(), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.enableTwoStepVerification({ user: req.user, lang: req.lang });
    return { message: "success.otpSent" };
}));
router.patch("/confirm-two-step-verification", middleware.authentication(), middleware.validation(validators.confirmTwoStepVerification), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.confirmTwoStepVerification({
        user: req.user,
        body: req.validate.body,
    });
    return { message: "success.twoStepVerificationEnabled" };
}));
router.patch("/request-forgot-password-code", middleware.validation(validators.requestForgetPasswordCode), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.requestForgetPasswordCode({
        body: req.validate.body,
        lang: req.lang,
    });
    return { message: "success.otpSent" };
}));
router.patch("/verify-forgot-password-code", middleware.validation(validators.verifyForgotPasswordCode), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.verifyForgotPasswordCode({ body: req.validate.body });
    return { message: "success.otpVerified" };
}));
router.patch("/reset-password", middleware.validation(validators.resetPassword), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.resetPassword({ body: req.validate.body });
    return { message: "success.passwordReset" };
}));
router.post("/rotate-token", middleware.authentication({
    tokenType: common_1.enums.TokenTypeEnum.REFRESH,
    allowBasic: false,
}), middleware.responseFormatter(async (req, res, next) => {
    const tokens = await auth_service_1.default.rotateToken({
        payload: req.payload,
        user: req.user,
        issuer: common_1.issuer.getIssuer(req),
    });
    return { message: "success.tokensRotated", data: tokens };
}));
router.post("/logout", middleware.authentication({ allowBasic: false }), middleware.validation(validators.logout), middleware.responseFormatter(async (req, res, next) => {
    await auth_service_1.default.logout({
        payload: req.payload,
        user: req.user,
        body: req.validate.body,
    });
    return { message: "success.logout" };
}));
exports.default = router;
