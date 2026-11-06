import z from "zod";
import * as validators from "../auth.validation";

export type SignupLoginWithGmailDto = z.infer<
  ReturnType<typeof validators.signupLoginWithGmail>
>;
export type SignupDto = z.infer<ReturnType<typeof validators.signup>>;
export type ConfirmEmailDto = z.infer<
  ReturnType<typeof validators.confirmEmail>
>;
export type ReSendConfirmEmailDto = z.infer<
  ReturnType<typeof validators.reSendConfirmEmail>
>;
export type LoginDto = z.infer<ReturnType<typeof validators.login>>;
export type LoginConfirmationDto = z.infer<
  ReturnType<typeof validators.loginConfirmation>
>;
export type ConfirmTwoStepVerificationDto = z.infer<
  ReturnType<typeof validators.confirmTwoStepVerification>
>;
export type RequestForgetPasswordCodeDto = z.infer<
  ReturnType<typeof validators.requestForgetPasswordCode>
>;
export type VerifyForgotPasswordCodeDto = z.infer<
  ReturnType<typeof validators.verifyForgotPasswordCode>
>;
export type ResetPasswordDto = z.infer<
  ReturnType<typeof validators.resetPassword>
>;
export type LogoutDto = z.infer<ReturnType<typeof validators.logout>>;
