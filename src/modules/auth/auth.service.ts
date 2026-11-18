import { OAuth2Client, TokenPayload } from "google-auth-library";
import {
  enums,
  exceptions,
  security,
  sendEmail,
  services,
  tps,
} from "../../common";
import configService from "../../config.service";
import { models, queries } from "../../DB";
import * as dto from "./dto/auth.dto";
import * as entities from "./entities/auth.entities";

class AuthenticationService {
  private userRepository: queries.UserRepository;
  private cacheService: services.CacheService;
  private tokenService: services.TokenService;
  private notificationService: services.NotificationService;
  private client: OAuth2Client;

  constructor() {
    this.userRepository = new queries.UserRepository();
    this.cacheService = services.cacheService;
    this.tokenService = services.tokenService;
    this.notificationService = services.notificationService;
    this.client = new OAuth2Client();
  }

  private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
    // google-auth-library throws a plain Error for a fake / expired / wrong-audience token
    const ticket = await this.client
      .verifyIdToken({
        idToken,
        audience: configService.WEB_CLIENT_IDS,
      })
      .catch(() => {
        throw new exceptions.UnauthorizedException("error.invalidToken");
      });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new exceptions.BadRequestException("error.invalidToken");
    }
    return payload;
  }

  async signupLoginWithGmail({
    body,
    issuer,
  }: {
    body: dto.SignupLoginWithGmailDto["body"];
    issuer: string;
  }): Promise<entities.ISignupWithGmailResponse> {
    const { email, picture, email_verified, given_name, family_name } =
      await this.verifyGoogleAccount(body.idToken);

    if (!email || !email_verified) {
      throw new exceptions.BadRequestException("error.emailNotVerified");
    }

    const existingEmail = await this.userRepository.findOne({
      filter: { email, paranoid: false },
    });
    if (existingEmail) {
      // if the email already exist with any provider not equal google
      if (existingEmail.provider != enums.ProviderEnum.GOOGLE) {
        throw new exceptions.ConflictException("error.invalidProvider");
      }

      if (existingEmail.status == enums.AccountStatusEnum.ARCHIVE) {
        throw new exceptions.ForbiddenException("error.accountArchived");
      }
      // login with gmail
      const { access_token, refresh_token } =
        await this.tokenService.createLoginCredentials({
          user: existingEmail,
          options: { issuer },
        });

      return { status: 200, access_token, refresh_token };
    }
    // signup with gmail
    const account = await this.userRepository.create({
      data: {
        firstName: given_name ?? email.split("@")[0],
        lastName: family_name,
        email,
        confirmEmail: new Date(),
        image: picture,
        provider: enums.ProviderEnum.GOOGLE,
      },
    });

    const { access_token, refresh_token } =
      await this.tokenService.createLoginCredentials({
        user: account,
        options: { issuer },
      });

    return { status: 201, access_token, refresh_token };
  }

  async signup({
    body,
    lang,
  }: {
    body: dto.SignupDto["body"];
    lang: enums.LanguageEnum;
  }): Promise<void> {
    const { email } = body;

    const existingEmail = await this.userRepository.findOne({
      filter: { email, paranoid: false },
    });

    if (existingEmail?.status == enums.AccountStatusEnum.ARCHIVE) {
      throw new exceptions.ForbiddenException("error.accountArchived");
    }

    if (existingEmail) {
      throw new exceptions.ConflictException("error.emailExists");
    }

    await this.userRepository.create({
      data: body,
    });

    await sendEmail.sendEmailOtp({
      email,
      lang,
    });

    return;
  }

  async confirmEmail({
    body,
    issuer,
  }: {
    body: dto.ConfirmEmailDto["body"];
    issuer: string;
  }): Promise<entities.ILoginResponse> {
    const { email, otp } = body;
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
        confirmEmail: { $exists: false },
      },
    });

    if (!account) {
      throw new exceptions.BadRequestException("error.invalidOtp");
    }

    await sendEmail.checkOTP({
      email,
      otp,
      subject: enums.EmailSubjectEnum.CONFIRM_EMAIL,
    });

    await this.userRepository.findByIdAndUpdate({
      id: account._id,
      update: {
        confirmEmail: new Date(),
      },
    });

    await this.cacheService.del({
      key: await this.cacheService.keys({
        prefix: sendEmail.UserEmailKey({
          email,
          subject: enums.EmailSubjectEnum.CONFIRM_EMAIL,
        }),
      }),
    });

    const { access_token, refresh_token } =
      await this.tokenService.createLoginCredentials({
        user: account,
        options: { issuer },
      });

    return { access_token, refresh_token };
  }

  async reSendConfirmEmail({
    body,
    lang,
  }: {
    body: dto.ReSendConfirmEmailDto["body"];
    lang: enums.LanguageEnum;
  }): Promise<void> {
    const { email } = body;
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
        confirmEmail: { $exists: false },
      },
    });

    if (!account) {
      return;
    }

    await sendEmail.sendEmailOtp({
      email,
      lang,
    });
  }

  async login({
    body,
    issuer,
    lang,
  }: {
    body: dto.LoginDto["body"];
    issuer: string;
    lang: enums.LanguageEnum;
  }): Promise<entities.ILoginResponse | void> {
    const { email, password, FCM } = body;

    const LoginTrialsKey = `User::${email}::Login_Trials`;

    // 1) check the block FIRST, before touching the password at all
    const currentTrials =
      (await this.cacheService.get({
        key: LoginTrialsKey,
      })) ?? 0;

    if (currentTrials >= configService.MAX_INCORRECT_PASSWORD_ATTEMPTS) {
      throw new exceptions.TooManyRequestException("error.loginLimitReached");
    }

    // Get the account that has the same email and signup with system and the confirmationEmail is true.
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
        paranoid: false,
      },
      projection: "+password",
    });

    // If there is no account invalid credentials.
    if (!account) {
      throw new exceptions.ForbiddenException("error.invalidCredentials");
    }

    // 2) Compare between the password that user enter and the actual user password.
    const match = await security.compare({
      plainText: password,
      cipherText: account.password as string,
    });

    // 3) wrong password → increase the trials and block when reaching the limit
    if (!match) {
      const finalTrials = await this.cacheService.incrBy({
        key: LoginTrialsKey,
      });

      if (
        finalTrials == 1 ||
        finalTrials == configService.MAX_INCORRECT_PASSWORD_ATTEMPTS
      ) {
        await this.cacheService.expire({
          key: LoginTrialsKey,
          ttl: configService.BLOCK_OTP_TIME,
        });
      }
      throw new exceptions.ForbiddenException("error.invalidCredentials");
    }

    // 4) correct password and not blocked → reset the trials
    await this.cacheService.del({
      key: LoginTrialsKey,
    });

    if (account.status == enums.AccountStatusEnum.ARCHIVE) {
      throw new exceptions.ForbiddenException("error.accountArchived");
    }

    if (account.twoStepVerification) {
      await sendEmail.sendEmailOtp({
        email,
        subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        lang,
      });

      return;
    }

    if (FCM) {
      const FCMS = await this.notificationService.getFCMs({
        userId: account._id,
      });

      await this.notificationService.sendNotifications({
        tokens: FCMS,
        title: "welcome",
        body: "hi hi",
      });

      await this.notificationService.addFCM({
        userId: account._id,
        FCMToken: FCM,
      });
    }

    const { access_token, refresh_token } =
      await this.tokenService.createLoginCredentials({
        user: account,
        options: { issuer },
      });

    return { access_token, refresh_token };
  }

  async loginConfirmation({
    body,
    issuer,
  }: {
    body: dto.LoginConfirmationDto["body"];
    issuer: string;
  }): Promise<entities.ILoginResponse> {
    const { email, otp } = body;
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
      },
    });

    if (!account) {
      throw new exceptions.BadRequestException("error.invalidOtp");
    }

    if (!account.twoStepVerification) {
      throw new exceptions.BadRequestException("error.invalidOtp");
    }

    await sendEmail.checkOTP({
      email,
      otp,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    });

    await this.cacheService.del({
      key: [
        sendEmail.UserEmailKey({
          email,
          subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        }),
        sendEmail.UserOtpTrialsKey({
          email,
          subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        }),
      ],
    });

    const { access_token, refresh_token } =
      await this.tokenService.createLoginCredentials({
        user: account,
        options: { issuer },
      });

    return { access_token, refresh_token };
  }

  async enableTwoStepVerification({
    user,
    lang,
  }: {
    user: models.HUser;
    lang: enums.LanguageEnum;
  }) {
    const { email, twoStepVerification } = user;

    if (twoStepVerification) {
      throw new exceptions.ConflictException(
        "error.twoStepVerificationAlreadyEnabled",
      );
    }

    await sendEmail.sendEmailOtp({
      email,
      lang,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    });
  }

  async confirmTwoStepVerification({
    user,
    body,
  }: {
    user: models.HUser;
    body: dto.ConfirmTwoStepVerificationDto["body"];
  }) {
    const { otp } = body;
    const { twoStepVerification } = user;

    if (twoStepVerification) {
      throw new exceptions.ConflictException(
        "error.twoStepVerificationAlreadyEnabled",
      );
    }

    await sendEmail.checkOTP({
      email: user.email,
      otp,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    });

    await this.userRepository.findByIdAndUpdate({
      id: user._id,
      update: {
        twoStepVerification: true,
      },
    });

    await this.cacheService.del({
      key: [
        sendEmail.UserEmailKey({
          email: user.email,
          subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        }),
        sendEmail.UserOtpTrialsKey({
          email: user.email,
          subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        }),
      ],
    });

    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: user._id }),
    });
  }

  // START RESET PASSWORD
  async requestForgetPasswordCode({
    body,
    lang,
  }: {
    body: dto.RequestForgetPasswordCodeDto["body"];
    lang: enums.LanguageEnum;
  }) {
    const { email } = body;
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
      },
    });

    if (!account) {
      return;
    }

    await sendEmail.sendEmailOtp({
      email,
      lang,
      subject: enums.EmailSubjectEnum.FORGOT_PASSWORD,
    });
  }

  async verifyForgotPasswordCode({
    body,
  }: {
    body: dto.VerifyForgotPasswordCodeDto["body"];
  }) {
    const { email, otp } = body;
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
      },
    });

    if (!account) {
      throw new exceptions.BadRequestException("error.invalidOtp");
    }

    await sendEmail.checkOTP({
      email,
      otp,
      subject: enums.EmailSubjectEnum.FORGOT_PASSWORD,
    });

    return account;
  }

  async resetPassword({ body }: { body: dto.ResetPasswordDto["body"] }) {
    const { email, otp, password } = body;
    const account = await this.verifyForgotPasswordCode({
      body: { email, otp },
    });

    account.password = password;
    account.changeCredentialsTime = new Date();

    await account.save();

    const [userRevokeKeys, userEmailKeys] = await Promise.all([
      this.cacheService.keys({
        prefix: this.tokenService.userBaseRevokeToken({
          userId: account._id,
        }),
      }),
      this.cacheService.keys({
        prefix: sendEmail.UserEmailKey({
          email,
          subject: enums.EmailSubjectEnum.FORGOT_PASSWORD,
        }),
      }),
    ]);

    await this.cacheService.del({
      key: [
        ...userRevokeKeys,
        ...userEmailKeys,
        this.tokenService.userBaseProfile({ userId: account._id }),
      ],
    });

    return;
  }
  // END RESET PASSWORD

  async rotateToken({
    payload,
    user,
    issuer,
  }: {
    payload: tps.TokenPayloadType;
    user: models.HUser;
    issuer: string;
  }): Promise<entities.ILoginResponse> {
    const accessExpiresIn =
      (payload.iat + configService.ACCESS_TOKEN_EXPIRES_IN) * 1000;
    const currentTime = Date.now() + 5 * 60000;

    if (currentTime < accessExpiresIn) {
      throw new exceptions.ConflictException("error.rotateTooEarly");
    }

    // revoke the old access + refresh tokens (they share the same jti),
    // so the old refresh token can't be used again after this rotate.
    await this.tokenService.createRevokeToken({ payload });

    // expires in refresh token REFRESH_TOKEN_EXPIRES_IN - (Math.ceil(Date.now() / 1000)) - payload.iat depend on the requirements.
    const { access_token, refresh_token } =
      await this.tokenService.createLoginCredentials({
        user,
        options: { issuer },
      });

    return { access_token, refresh_token };
  }

  async logout({
    payload,
    user,
    body,
  }: {
    payload: tps.TokenPayloadType;
    user: models.HUser;
    body: dto.LogoutDto["body"];
  }) {
    const { action } = body;
    switch (action) {
      case enums.LogoutEnum.ALL:
        await this.userRepository.findByIdAndUpdate({
          id: user._id,
          update: {
            changeCredentialsTime: new Date(),
          },
        });

        const userRevokeKeys = await this.cacheService.keys({
          prefix: this.tokenService.userBaseRevokeToken({
            userId: payload.sub,
          }),
        });

        await this.cacheService.del({
          key: [
            ...userRevokeKeys,
            this.tokenService.userBaseProfile({ userId: payload.sub }),
          ],
        });

        break;

      default:
        await this.tokenService.createRevokeToken({ payload });
        break;
    }
    return;
  }
}

export default new AuthenticationService();
