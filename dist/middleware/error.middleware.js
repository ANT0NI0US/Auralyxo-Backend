"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const common_1 = require("../common");
const config_service_1 = __importDefault(require("../config.service"));
const globalErrorHandling = (error, req, res, next) => {
    let status = 500;
    let message = error.message;
    let issues;
    if (error instanceof common_1.exceptions.ApplicationException) {
        status = error.status;
        issues = error.cause;
    }
    else if (error instanceof mongoose_1.default.Error.ValidationError) {
        status = 400;
        message = "validation.general.error";
        issues = Object.values(error.errors).map((e) => ({
            path: [e.path],
            message: (0, common_1.translate)(req.lang, e instanceof mongoose_1.default.Error.CastError
                ? "validation.general.invalidType"
                : e.message),
        }));
    }
    else if (error instanceof mongoose_1.default.mongo.MongoServerError &&
        error.code === 11000) {
        status = 409;
        const field = Object.keys(error.keyPattern ?? {})[0];
        const key = `error.duplicate.${field}`;
        message =
            (0, common_1.translate)(common_1.enums.LanguageEnum.EN, key) === key
                ? "error.duplicate.default"
                : key;
    }
    else if (error instanceof mongoose_1.default.Error.CastError) {
        status = 400;
        message = "error.invalidId";
    }
    const isProduction = config_service_1.default.NODE_ENV == "production";
    const defaultErrorMessage = "error.server";
    const displayErrorMessage = message || defaultErrorMessage;
    return res.status(status).json({
        status_code: status,
        message: (0, common_1.translate)(req.lang, isProduction && status == 500 ? defaultErrorMessage : displayErrorMessage),
        issues,
        stack: isProduction ? undefined : error.stack,
    });
};
exports.globalErrorHandling = globalErrorHandling;
