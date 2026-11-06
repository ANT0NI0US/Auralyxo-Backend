"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicAuth = exports.createRevokeToken = exports.createLoginCredentials = exports.decodeToken = exports.getSignature = exports.getTokenSignatures = exports.verifyToken = exports.createToken = exports.userRevokeToken = exports.userBaseRevokeToken = exports.userBaseProfile = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const node_crypto_1 = require("node:crypto");
const common_1 = require("../../common");
const config_service_js_1 = __importDefault(require("../../config.service.js"));
const DB_1 = require("../../DB");
let userRepository;
const getUserRepository = () => (userRepository ??= new DB_1.queries.UserRepository());
const userBaseProfile = ({ userId }) => {
    return `User::${userId.toString()}::Profile`;
};
exports.userBaseProfile = userBaseProfile;
const userBaseRevokeToken = ({ userId }) => {
    return `User::${userId.toString()}::Revoke_Token`;
};
exports.userBaseRevokeToken = userBaseRevokeToken;
const userRevokeToken = ({ userId, jti, }) => {
    return `${(0, exports.userBaseRevokeToken)({ userId })}::${jti}`;
};
exports.userRevokeToken = userRevokeToken;
const createToken = async ({ payload = {}, secret = config_service_js_1.default.ACCESS_USER_TOKEN_SIGNATURE, options = {}, }) => {
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.createToken = createToken;
const verifyToken = async ({ token = "", secret = config_service_js_1.default.ACCESS_USER_TOKEN_SIGNATURE, }) => {
    const payload = jsonwebtoken_1.default.verify(token, secret);
    if (typeof payload === "string" ||
        !payload.sub ||
        !payload.jti ||
        !payload.iat) {
        throw new common_1.exceptions.BadRequestException("error.missingTokenPayload");
    }
    return payload;
};
exports.verifyToken = verifyToken;
const getTokenSignatures = async ({ role = common_1.enums.RoleEnum.USER, }) => {
    let signatures;
    switch (role) {
        case common_1.enums.RoleEnum.ADMIN:
            signatures = {
                accessSignature: config_service_js_1.default.ACCESS_ADMIN_TOKEN_SIGNATURE,
                refreshSignature: config_service_js_1.default.REFRESH_ADMIN_TOKEN_SIGNATURE,
            };
            break;
        default:
            signatures = {
                accessSignature: config_service_js_1.default.ACCESS_USER_TOKEN_SIGNATURE,
                refreshSignature: config_service_js_1.default.REFRESH_USER_TOKEN_SIGNATURE,
            };
            break;
    }
    return signatures;
};
exports.getTokenSignatures = getTokenSignatures;
const getSignature = async ({ tokenType = common_1.enums.TokenTypeEnum.ACCESS, role = common_1.enums.RoleEnum.USER, }) => {
    const { accessSignature, refreshSignature } = await (0, exports.getTokenSignatures)({
        role,
    });
    return tokenType == common_1.enums.TokenTypeEnum.ACCESS
        ? accessSignature
        : refreshSignature;
};
exports.getSignature = getSignature;
const decodeToken = async ({ authorization = "", tokenType = common_1.enums.TokenTypeEnum.ACCESS, } = {}) => {
    const decoded = jsonwebtoken_1.default.decode(authorization, { json: true });
    const role = Array.isArray(decoded?.aud) ? decoded.aud[0] : decoded?.aud;
    if (!role) {
        throw new common_1.exceptions.BadRequestException("error.missingTokenPayload");
    }
    const secret = await (0, exports.getSignature)({
        tokenType,
        role: Number(role),
    });
    const payload = await (0, exports.verifyToken)({ token: authorization, secret });
    if (await common_1.services.cacheService.exist({
        key: (0, exports.userRevokeToken)({ userId: payload.sub, jti: payload.jti }),
    })) {
        throw new common_1.exceptions.UnauthorizedException("error.tokenRevoked");
    }
    const cachedUser = await common_1.services.cacheService.get({
        key: (0, exports.userBaseProfile)({ userId: payload.sub }),
    });
    const user = cachedUser
        ? DB_1.models.UserModel.hydrate(cachedUser)
        : await getUserRepository().findById({
            id: new mongoose_1.default.Types.ObjectId(payload.sub),
            projection: "-password",
        });
    if (!user) {
        throw new common_1.exceptions.NotFoundException("error.invalidUser");
    }
    if (!cachedUser) {
        await common_1.services.cacheService.set({
            key: (0, exports.userBaseProfile)({ userId: payload.sub }),
            value: user,
            ttl: 60 * 60 * 24,
        });
    }
    const changeCredentialsTime = user.changeCredentialsTime
        ? new Date(user.changeCredentialsTime).getTime()
        : 0;
    if (changeCredentialsTime > payload.iat * 1000) {
        throw new common_1.exceptions.UnauthorizedException("error.tokenRevoked");
    }
    return { user, payload };
};
exports.decodeToken = decodeToken;
const createLoginCredentials = async ({ user, options = {}, }) => {
    const { accessSignature, refreshSignature } = await (0, exports.getTokenSignatures)({
        role: user.role,
    });
    const jwtid = (0, node_crypto_1.randomUUID)();
    const access_token = await (0, exports.createToken)({
        payload: { sub: user.id },
        secret: accessSignature,
        options: {
            ...options,
            audience: [String(user.role)],
            expiresIn: config_service_js_1.default.ACCESS_TOKEN_EXPIRES_IN,
            jwtid,
        },
    });
    const refresh_token = await (0, exports.createToken)({
        payload: { sub: user.id },
        secret: refreshSignature,
        options: {
            ...options,
            audience: [String(user.role)],
            expiresIn: config_service_js_1.default.REFRESH_TOKEN_EXPIRES_IN,
            jwtid,
        },
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const createRevokeToken = async ({ payload, }) => {
    const consumedTime = Math.ceil(Date.now() / 1000 - payload.iat);
    const refreshExpiresIn = payload.iat + config_service_js_1.default.REFRESH_TOKEN_EXPIRES_IN;
    const ttl = refreshExpiresIn - consumedTime;
    await common_1.services.cacheService.set({
        key: (0, exports.userRevokeToken)({ userId: payload.sub, jti: payload.jti }),
        value: payload.jti,
        ttl,
    });
    await common_1.services.cacheService.del({
        key: (0, exports.userBaseProfile)({ userId: payload.sub }),
    });
};
exports.createRevokeToken = createRevokeToken;
const basicAuth = async ({ email, password, }) => {
    const account = await getUserRepository().findOne({
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
};
exports.basicAuth = basicAuth;
