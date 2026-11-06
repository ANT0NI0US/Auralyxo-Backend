"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = exports.bearerAuth = void 0;
const common_1 = require("../common");
const bearerAuth = async ({ req, tokenType = common_1.enums.TokenTypeEnum.ACCESS, }) => {
    const [_, credential] = req.headers["authorization"]?.split(" ") || [];
    const { user, payload } = await common_1.services.tokenService.decodeToken({
        authorization: credential,
        tokenType,
    });
    req.user = user;
    req.payload = payload;
};
exports.bearerAuth = bearerAuth;
const authentication = ({ tokenType = common_1.enums.TokenTypeEnum.ACCESS, allowBasic = true, } = {}) => {
    return async (req, res, next) => {
        const { authorization } = req.headers;
        if (!authorization) {
            throw new common_1.exceptions.UnauthorizedException("error.unauthorized");
        }
        const [key, credential] = (authorization?.split(" ") || []);
        switch (key) {
            case common_1.enums.AuthEnum.BEARER:
                await (0, exports.bearerAuth)({ req, tokenType });
                break;
            case common_1.enums.AuthEnum.BASIC:
                if (!allowBasic) {
                    throw new common_1.exceptions.BadRequestException("error.basicAuthNotAllowed");
                }
                const [email, password] = Buffer.from(credential, "base64")
                    .toString()
                    ?.split(":");
                req.user = await common_1.services.tokenService.basicAuth({
                    email: email,
                    password: password,
                });
                break;
            default:
                throw new common_1.exceptions.BadRequestException("error.invalidAuthKey");
                break;
        }
        next();
    };
};
exports.authentication = authentication;
