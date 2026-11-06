"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersByAccountStatusEnum = exports.AccountStatusEnum = exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
var GenderEnum;
(function (GenderEnum) {
    GenderEnum[GenderEnum["MALE"] = 0] = "MALE";
    GenderEnum[GenderEnum["FEMALE"] = 1] = "FEMALE";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum[RoleEnum["USER"] = 0] = "USER";
    RoleEnum[RoleEnum["ADMIN"] = 1] = "ADMIN";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum[ProviderEnum["SYSTEM"] = 0] = "SYSTEM";
    ProviderEnum[ProviderEnum["GOOGLE"] = 1] = "GOOGLE";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
var AccountStatusEnum;
(function (AccountStatusEnum) {
    AccountStatusEnum[AccountStatusEnum["ARCHIVE"] = 0] = "ARCHIVE";
    AccountStatusEnum[AccountStatusEnum["ACTIVE"] = 1] = "ACTIVE";
})(AccountStatusEnum || (exports.AccountStatusEnum = AccountStatusEnum = {}));
var UsersByAccountStatusEnum;
(function (UsersByAccountStatusEnum) {
    UsersByAccountStatusEnum[UsersByAccountStatusEnum["ARCHIVE"] = 0] = "ARCHIVE";
    UsersByAccountStatusEnum[UsersByAccountStatusEnum["ACTIVE"] = 1] = "ACTIVE";
    UsersByAccountStatusEnum[UsersByAccountStatusEnum["ALL"] = 2] = "ALL";
})(UsersByAccountStatusEnum || (exports.UsersByAccountStatusEnum = UsersByAccountStatusEnum = {}));
Object.freeze(GenderEnum);
Object.freeze(RoleEnum);
Object.freeze(ProviderEnum);
Object.freeze(AccountStatusEnum);
Object.freeze(UsersByAccountStatusEnum);
