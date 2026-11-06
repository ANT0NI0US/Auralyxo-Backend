"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenService = exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const common_1 = require("../../common");
const config_service_1 = __importDefault(require("../../config.service"));
const DB_1 = require("../../DB");
const cache_service_1 = require("./cache.service");
class TokenService {
    userRepository;
    cacheService;
    constructor() {
        this.userRepository = new DB_1.queries.UserRepository();
        this.cacheService = cache_service_1.cacheService;
    }
    userBaseProfile({ userId }) {
        return `User::${userId.toString()}::Profile`;
    }
    userBaseRevokeToken({ userId }) {
        return `User::${userId.toString()}::Revoke_Token`;
    }
    userRevokeToken({ userId, jti }) {
        return `${this.userBaseRevokeToken({ userId })}::${jti}`;
    }
    async createToken({ payload = {}, secret = config_service_1.default.ACCESS_USER_TOKEN_SIGNATURE, options = {}, }) {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    async verifyToken({ token = "", secret = config_service_1.default.ACCESS_USER_TOKEN_SIGNATURE, }) {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    async getTokenSignatures({ role = common_1.enums.RoleEnum.USER, }) {
        let signatures;
        switch (role) {
            case common_1.enums.RoleEnum.ADMIN:
                signatures = {
                    accessSignature: config_service_1.default.ACCESS_ADMIN_TOKEN_SIGNATURE,
                    refreshSignature: config_service_1.default.REFRESH_ADMIN_TOKEN_SIGNATURE,
                };
                break;
            default:
                signatures = {
                    accessSignature: config_service_1.default.ACCESS_USER_TOKEN_SIGNATURE,
                    refreshSignature: config_service_1.default.REFRESH_USER_TOKEN_SIGNATURE,
                };
                break;
        }
        return signatures;
    }
    async getSignature({ tokenType = common_1.enums.TokenTypeEnum.ACCESS, role = common_1.enums.RoleEnum.USER, }) {
        const { accessSignature, refreshSignature } = await this.getTokenSignatures({
            role,
        });
        return tokenType == common_1.enums.TokenTypeEnum.ACCESS
            ? accessSignature
            : refreshSignature;
    }
    async decodeToken({ authorization = "", tokenType = common_1.enums.TokenTypeEnum.ACCESS, } = {}) {
        const decoded = jsonwebtoken_1.default.decode(authorization);
        if (!decoded?.aud?.length) {
            throw new common_1.exceptions.BadRequestException("error.missingTokenPayload");
        }
        const secret = await this.getSignature({
            tokenType,
            role: Number(decoded.aud[0]),
        });
        const payload = await this.verifyToken({ token: authorization, secret });
        if (!payload?.sub) {
            throw new common_1.exceptions.BadRequestException("error.missingTokenPayload");
        }
        if (await this.cacheService.exist({
            key: this.userRevokeToken({ userId: payload.sub, jti: payload.jti }),
        })) {
            throw new common_1.exceptions.UnauthorizedException("error.tokenRevoked");
        }
        const cachedUser = await this.cacheService.get({
            key: this.userBaseProfile({ userId: payload.sub }),
        });
        const user = cachedUser
            ? DB_1.models.UserModel.hydrate(cachedUser)
            : await this.userRepository.findById({
                id: common_1.objectId.toObjectId({ id: payload.sub }),
                projection: "-password",
            });
        if (!user) {
            throw new common_1.exceptions.NotFoundException("error.invalidUser");
        }
        if (!cachedUser) {
            await this.cacheService.set({
                key: this.userBaseProfile({ userId: payload.sub }),
                value: user,
                ttl: config_service_1.default.USER_PROFILE_CACHE_TTL,
            });
        }
        const changeCredentialsTime = user.changeCredentialsTime
            ? new Date(user.changeCredentialsTime).getTime()
            : 0;
        if (changeCredentialsTime > payload.iat * 1000) {
            throw new common_1.exceptions.UnauthorizedException("error.tokenRevoked");
        }
        return { user, payload };
    }
    async createLoginCredentials({ user, options = {}, }) {
        const { accessSignature, refreshSignature } = await this.getTokenSignatures({
            role: user.role,
        });
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = await this.createToken({
            payload: { sub: user.id },
            secret: accessSignature,
            options: {
                ...options,
                audience: [String(user.role)],
                expiresIn: config_service_1.default.ACCESS_TOKEN_EXPIRES_IN,
                jwtid,
            },
        });
        const refresh_token = await this.createToken({
            payload: { sub: user.id },
            secret: refreshSignature,
            options: {
                ...options,
                audience: [String(user.role)],
                expiresIn: config_service_1.default.REFRESH_TOKEN_EXPIRES_IN,
                jwtid,
            },
        });
        return { access_token, refresh_token };
    }
    async createRevokeToken({ payload }) {
        const consumedTime = Math.ceil(Date.now() / 1000 - payload.iat);
        const refreshExpiresIn = payload.iat + config_service_1.default.REFRESH_TOKEN_EXPIRES_IN;
        const ttl = refreshExpiresIn - consumedTime;
        await this.cacheService.set({
            key: this.userRevokeToken({ userId: payload.sub, jti: payload.jti }),
            value: payload.jti,
            ttl,
        });
        await this.cacheService.del({
            key: this.userBaseProfile({ userId: payload.sub }),
        });
    }
    async basicAuth({ email, password }) {
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
            throw new common_1.exceptions.ForbiddenException("error.invalidCredentials");
        }
        return account;
    }
}
exports.TokenService = TokenService;
exports.tokenService = new TokenService();
