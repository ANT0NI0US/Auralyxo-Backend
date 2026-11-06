"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const google_auth_library_1 = require("google-auth-library");
const common_1 = require("../../common");
const config_service_1 = __importDefault(require("../../config.service"));
const DB_1 = require("../../DB");
class AuthenticationService {
    userRepository;
    cacheService;
    tokenService;
    client;
    constructor() {
        this.userRepository = new DB_1.queries.UserRepository();
        this.cacheService = common_1.services.cacheService;
        this.tokenService = common_1.services.tokenService;
        this.client = new google_auth_library_1.OAuth2Client();
    }
    async verifyGoogleAccount(idToken) {
        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: config_service_1.default.WEB_CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new common_1.exceptions.BadRequestException("error.invalidToken");
        }
        return payload;
    }
    async signupLoginWithGmail({ body, issuer, }) {
        const { name, email, picture, email_verified } = await this.verifyGoogleAccount(body.idToken);
        if (!email || !email_verified) {
            throw new common_1.exceptions.BadRequestException("error.emailNotVerified");
        }
        const existingEmail = await this.userRepository.findOne({
            filter: { email },
        });
        if (existingEmail) {
            if (existingEmail.provider != common_1.enums.ProviderEnum.GOOGLE) {
                throw new common_1.exceptions.ConflictException("error.invalidProvider");
            }
            const { access_token, refresh_token } = await this.tokenService.createLoginCredentials({
                user: existingEmail,
                options: { issuer },
            });
            return { status: 200, access_token, refresh_token };
        }
        const account = await this.userRepository.create({
            data: {
                username: name,
                email,
                confirmEmail: new Date(),
                image: picture,
                provider: common_1.enums.ProviderEnum.GOOGLE,
            },
        });
        const { access_token, refresh_token } = await this.tokenService.createLoginCredentials({
            user: account,
            options: { issuer },
        });
        return { status: 201, access_token, refresh_token };
    }
    async signup({ body, lang, }) {
        const { email } = body;
        const existingEmail = await this.userRepository.findOne({
            filter: { email, paranoid: false },
        });
        if (existingEmail?.status == common_1.enums.AccountStatusEnum.ARCHIVE) {
            throw new common_1.exceptions.ForbiddenException("error.accountArchived");
        }
        if (existingEmail) {
            throw new common_1.exceptions.ConflictException("error.emailExists");
        }
        await this.userRepository.create({
            data: body,
        });
        await common_1.sendEmail.sendEmailOtp({
            email,
            lang,
        });
        return;
    }
    async confirmEmail({ body, issuer, }) {
        const { email, otp } = body;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                provider: common_1.enums.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: false },
            },
        });
        if (!account) {
            throw new common_1.exceptions.NotFoundException("error.invalidAccount");
        }
        await common_1.sendEmail.checkOTP({
            email,
            otp,
            subject: common_1.enums.EmailSubjectEnum.CONFIRM_EMAIL,
        });
        account.confirmEmail = new Date();
        await account.save();
        await this.cacheService.del({
            key: await this.cacheService.keys({
                prefix: common_1.sendEmail.UserEmailKey({
                    email,
                    subject: common_1.enums.EmailSubjectEnum.CONFIRM_EMAIL,
                }),
            }),
        });
        const { access_token, refresh_token } = await this.tokenService.createLoginCredentials({
            user: account,
            options: { issuer },
        });
        return { access_token, refresh_token };
    }
    async reSendConfirmEmail({ body, lang, }) {
        const { email } = body;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                provider: common_1.enums.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: false },
            },
        });
        if (!account) {
            throw new common_1.exceptions.NotFoundException("error.invalidAccount");
        }
        await common_1.sendEmail.sendEmailOtp({
            email,
            lang,
        });
    }
    async login({ body, issuer, lang, }) {
        const { email, password } = body;
        const LoginTrialsKey = `User::${email}::Login_Trials`;
        const currentTrials = (await this.cacheService.get({
            key: LoginTrialsKey,
        })) ?? 0;
        if (currentTrials >= config_service_1.default.MAX_INCORRECT_PASSWORD_ATTEMPTS) {
            throw new common_1.exceptions.TooManyRequestException("error.loginLimitReached");
        }
        const account = await this.userRepository.findOne({
            filter: {
                email,
                provider: common_1.enums.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true },
            },
        });
        if (!account) {
            throw new common_1.exceptions.ForbiddenException("error.invalidCredentials");
        }
        const match = await common_1.security.compare({
            plainText: password,
            cipherText: account.password,
        });
        if (!match) {
            const finalTrials = await this.cacheService.incrBy({
                key: LoginTrialsKey,
            });
            if (finalTrials == config_service_1.default.MAX_INCORRECT_PASSWORD_ATTEMPTS) {
                await this.cacheService.expire({
                    key: LoginTrialsKey,
                    ttl: config_service_1.default.BLOCK_OTP_TIME,
                });
            }
            throw new common_1.exceptions.ForbiddenException("error.invalidCredentials");
        }
        await this.cacheService.del({
            key: LoginTrialsKey,
        });
        if (account.twoStepVerification) {
            await common_1.sendEmail.sendEmailOtp({
                email,
                subject: common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
                lang,
            });
            return;
        }
        const { access_token, refresh_token } = await this.tokenService.createLoginCredentials({
            user: account,
            options: { issuer },
        });
        return { access_token, refresh_token };
    }
    async loginConfirmation({ body, issuer, }) {
        const { email, otp } = body;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                provider: common_1.enums.ProviderEnum.SYSTEM,
            },
        });
        if (!account) {
            throw new common_1.exceptions.NotFoundException("error.invalidAccount");
        }
        await common_1.sendEmail.checkOTP({
            email,
            otp,
            subject: common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        });
        await this.cacheService.del({
            key: common_1.sendEmail.UserEmailKey({
                email,
                subject: common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
            }),
        });
        const { access_token, refresh_token } = await this.tokenService.createLoginCredentials({
            user: account,
            options: { issuer },
        });
        return { access_token, refresh_token };
    }
    async enableTwoStepVerification({ user, lang, }) {
        const { email } = user;
        await common_1.sendEmail.sendEmailOtp({
            email,
            lang,
            subject: common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        });
    }
    async confirmTwoStepVerification({ user, body, }) {
        const { otp } = body;
        await common_1.sendEmail.checkOTP({
            email: user.email,
            otp,
            subject: common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
        });
        user.twoStepVerification = true;
        await user.save({ validateModifiedOnly: true });
        await this.cacheService.del({
            key: common_1.sendEmail.UserEmailKey({
                email: user.email,
                subject: common_1.enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
            }),
        });
        await this.cacheService.del({
            key: this.tokenService.userBaseProfile({ userId: user._id }),
        });
    }
    async requestForgetPasswordCode({ body, lang, }) {
        const { email } = body;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                provider: common_1.enums.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true },
            },
        });
        if (!account) {
            throw new common_1.exceptions.NotFoundException("error.invalidAccount");
        }
        await common_1.sendEmail.sendEmailOtp({
            email,
            lang,
            subject: common_1.enums.EmailSubjectEnum.FORGOT_PASSWORD,
        });
    }
    async verifyForgotPasswordCode({ body, }) {
        const { email, otp } = body;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                provider: common_1.enums.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true },
            },
        });
        if (!account) {
            throw new common_1.exceptions.NotFoundException("error.invalidAccount");
        }
        await common_1.sendEmail.checkOTP({
            email,
            otp,
            subject: common_1.enums.EmailSubjectEnum.FORGOT_PASSWORD,
        });
        return account;
    }
    async resetPassword({ body }) {
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
                prefix: common_1.sendEmail.UserEmailKey({
                    email,
                    subject: common_1.enums.EmailSubjectEnum.FORGOT_PASSWORD,
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
    async rotateToken({ payload, user, issuer, }) {
        const accessExpiresIn = (payload.iat + config_service_1.default.ACCESS_TOKEN_EXPIRES_IN) * 1000;
        const currentTime = Date.now() + 5 * 60000;
        if (currentTime < accessExpiresIn) {
            throw new common_1.exceptions.ConflictException("error.rotateTooEarly");
        }
        await this.tokenService.createRevokeToken({ payload });
        const { access_token, refresh_token } = await this.tokenService.createLoginCredentials({
            user,
            options: { issuer },
        });
        return { access_token, refresh_token };
    }
    async logout({ payload, user, body, }) {
        const { action } = body;
        switch (action) {
            case common_1.enums.LogoutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save({ validateModifiedOnly: true });
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
exports.default = new AuthenticationService();
