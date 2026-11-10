import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { enums, issuer, itf } from "../../common";
import * as middleware from "../../middleware";
import as from "./auth.service";
import * as validators from "./auth.validation";
import * as entities from "./entities/auth.entities";

const router = Router({ caseSensitive: true, strict: true });

// -------------------------------------------------- SIGN UP WITH GOOGLE --------------------------------------------------- //
router.post(
  "/signup-with-gmail",
  middleware.validation(validators.signupLoginWithGmail),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<entities.ILoginResponse>> => {
      const { status, ...tokens } = await as.signupLoginWithGmail({
        body: req.validate.body,
        issuer: issuer.getIssuer(req),
      });
      return {
        status,
        message: status == 200 ? "success.gmailLogin" : "success.gmailSignup",
        data: tokens,
      };
    },
  ),
);
// -------------------------------------------------- SIGN UP --------------------------------------------------- //
router.post(
  "/signup",
  middleware.validation(validators.signup),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.signup({
        body: req.validate.body,
        lang: req.lang,
      });
      return { status: 201, message: "success.signup" };
    },
  ),
);
// -------------------------------------------------- CONFIRM EMAIL --------------------------------------------------- //
router.patch(
  "/confirm-email",
  middleware.validation(validators.confirmEmail),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<entities.ILoginResponse>> => {
      const tokens = await as.confirmEmail({
        body: req.validate.body,
        issuer: issuer.getIssuer(req),
      });
      return { message: "success.emailConfirmed", data: tokens };
    },
  ),
);
// -------------------------------------------------- RESEND CONFIRM EMAIL --------------------------------------------------- //
router.patch(
  "/resend-confirm-email",
  middleware.validation(validators.reSendConfirmEmail),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.reSendConfirmEmail({
        body: req.validate.body,
        lang: req.lang,
      });
      return { message: "success.otpSent" };
    },
  ),
);
// -------------------------------------------------- LOGIN --------------------------------------------------- //
// const loginLimiterMiddleware = limiter.generateRateLimiter({
//   limit: 5,
//   ttl: 5,
//   skipSuccessfulRequests: true,
// });
router.post(
  "/login",
  // loginLimiterMiddleware,
  middleware.validation(validators.login),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<entities.ILoginResponse | void>> => {
      const tokens = await as.login({
        body: req.validate.body,
        issuer: issuer.getIssuer(req),
        lang: req.lang,
      });
      // delete the key after i enter a correct email and password
      // await services.del({ key: req.rateLimit.key });
      return {
        message: tokens ? "success.login" : "success.otpSent",
        data: tokens,
      };
    },
  ),
);
// -------------------------------------------------- LOGIN CONFIRMATION --------------------------------------------------- //
router.patch(
  "/login-confirmation",
  middleware.validation(validators.loginConfirmation),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<entities.ILoginResponse>> => {
      const tokens = await as.loginConfirmation({
        body: req.validate.body,
        issuer: issuer.getIssuer(req),
      });
      return { message: "success.login", data: tokens };
    },
  ),
);
// -------------------------------------------------- ENABLE TWO STEP VERIFICATION ----------------------------------------- //
router.post(
  "/enable-two-step-verification",
  middleware.authentication(),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.enableTwoStepVerification({ user: req.user, lang: req.lang });

      return { message: "success.otpSent" };
    },
  ),
);
// -------------------------------------------------- CONFIRM TWO STEP VERIFICATION ----------------------------------------- //
router.patch(
  "/confirm-two-step-verification",
  middleware.authentication(),
  middleware.validation(validators.confirmTwoStepVerification),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.confirmTwoStepVerification({
        user: req.user,
        body: req.validate.body,
      });

      return { message: "success.twoStepVerificationEnabled" };
    },
  ),
);
// -------------------------------------------------- REQUEST FORGOT PASSWORD CODE ----------------------------------------- //
router.post(
  "/request-forgot-password-code",
  middleware.validation(validators.requestForgetPasswordCode),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.requestForgetPasswordCode({
        body: req.validate.body,
        lang: req.lang,
      });

      return { message: "success.otpSent" };
    },
  ),
);
// -------------------------------------------------- VERIFY FORGOT PASSWORD CODE ----------------------------------------- //
router.post(
  "/verify-forgot-password-code",
  middleware.validation(validators.verifyForgotPasswordCode),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.verifyForgotPasswordCode({ body: req.validate.body });

      return { message: "success.otpVerified" };
    },
  ),
);
// -------------------------------------------------- RESET PASSWORD ----------------------------------------- //
router.patch(
  "/reset-password",
  middleware.validation(validators.resetPassword),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.resetPassword({ body: req.validate.body });

      return { message: "success.passwordReset" };
    },
  ),
);
// ---------------------------------------------------------- ROTATE TOKEN -------------------------------------------------- //
router.post(
  "/rotate-token",
  middleware.authentication({
    tokenType: enums.TokenTypeEnum.REFRESH,
    allowBasic: false,
  }),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<entities.ILoginResponse>> => {
      const tokens = await as.rotateToken({
        payload: req.payload,
        user: req.user,
        issuer: issuer.getIssuer(req),
      });

      return { message: "success.tokensRotated", data: tokens };
    },
  ),
);
// ---------------------------------------------------------- LOGOUT-------------------------------------------------- //
router.post(
  "/logout",
  middleware.authentication({ allowBasic: false }),
  middleware.validation(validators.logout),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await as.logout({
        payload: req.payload,
        user: req.user,
        body: req.validate.body,
      });

      return { message: "success.logout" };
    },
  ),
);
export default router;
