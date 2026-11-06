"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutEnum = exports.TokenTypeEnum = void 0;
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum[TokenTypeEnum["ACCESS"] = 0] = "ACCESS";
    TokenTypeEnum[TokenTypeEnum["REFRESH"] = 1] = "REFRESH";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum[LogoutEnum["DEVICE"] = 0] = "DEVICE";
    LogoutEnum[LogoutEnum["ALL"] = 1] = "ALL";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
Object.freeze(TokenTypeEnum);
Object.freeze(LogoutEnum);
