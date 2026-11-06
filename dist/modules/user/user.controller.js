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
const user_service_1 = __importDefault(require("./user.service"));
const validators = __importStar(require("./user.validation"));
const router = (0, express_1.Router)({ caseSensitive: true, strict: true });
router.get("/profile", middleware.authentication(), middleware.responseFormatter(async (req, res, next) => {
    const user = await user_service_1.default.profile({ user: req.user });
    return { message: "success.userRetrieved", data: user };
}));
router.get("/all", middleware.authentication(), middleware.authorization({ accessRole: common_1.enums.RoleEnum.ADMIN }), middleware.validation(validators.getAllUsers), middleware.responseFormatter(async (req, res, next) => {
    const users = await user_service_1.default.allUsers({
        user: req.user,
        query: req.validate.query,
    });
    return { message: "success.usersRetrieved", data: users };
}));
router.patch("/update", middleware.authentication(), middleware.validation(validators.update), middleware.responseFormatter(async (req, res, next) => {
    const updatedUser = await user_service_1.default.updateUser({
        user: req.user,
        updatedData: req.validate.body,
    });
    return { message: "success.userUpdated", data: updatedUser };
}));
router.get("/:userId/share-profile", middleware.validation(validators.shareProfile), middleware.responseFormatter(async (req, res, next) => {
    const user = await user_service_1.default.shareProfile({ params: req.validate.params });
    return { message: "success.userRetrieved", data: user };
}));
router.patch("/profile-image", middleware.authentication(), middleware.fileUploadMiddleware({
    isRequired: true,
    customPath: "User",
    multerMiddleware: common_1.fileUpload.createUploader({}).single("attachment"),
    validation: common_1.fileUpload.fileValidation.image,
}), middleware.validation(validators.profileImage), middleware.responseFormatter(async (req, res, next) => {
    const image = await user_service_1.default.profileImage({
        user: req.user,
        file: req.validate.file,
    });
    return { message: "success.userRetrieved", data: image };
}));
exports.default = router;
