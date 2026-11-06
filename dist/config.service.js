"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_PROFILE_CACHE_TTL = exports.PAGE = exports.PAGINATION_LIMIT = exports.MAX_INCORRECT_PASSWORD_ATTEMPTS = exports.MAX_OTP_TRIALS = exports.BLOCK_OTP_TIME = exports.OTP_EXPIRES_TIME = exports.INSTAGRAM = exports.TWITTER = exports.FACEBOOK = exports.APP_EMAIL = exports.APP_PASSWORD = exports.WEB_CLIENT_IDS = exports.REFRESH_TOKEN_EXPIRES_IN = exports.REFRESH_USER_TOKEN_SIGNATURE = exports.REFRESH_ADMIN_TOKEN_SIGNATURE = exports.ACCESS_TOKEN_EXPIRES_IN = exports.ACCESS_USER_TOKEN_SIGNATURE = exports.ACCESS_ADMIN_TOKEN_SIGNATURE = exports.IV_LENGTH = exports.ENC_KEY = exports.SALT_ROUND = exports.DB_REDIS_URI = exports.DB_URI = exports.WEBSITE_URL = exports.APPLICATION_NAME = exports.PORT = exports.NODE_ENV = void 0;
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
exports.NODE_ENV = process.env.NODE_ENV ?? "development";
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(`./.env.${exports.NODE_ENV}`) });
exports.PORT = parseInt(process.env.PORT ?? "4000");
exports.APPLICATION_NAME = process.env.APPLICATION_NAME;
exports.WEBSITE_URL = `${process.env.WEBSITE_URL}${exports.PORT}/`;
const DB_URL = process.env.DB_URL_ATLAS;
const DB_NAME = process.env.DB_NAME || "Auralyxo";
exports.DB_URI = `${DB_URL}/${DB_NAME}`;
exports.DB_REDIS_URI = process.env.DB_REDIS_URI;
exports.SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "12");
exports.ENC_KEY = process.env.ENC_KEY;
exports.IV_LENGTH = parseInt(process.env.IV_LENGTH ?? "16");
exports.ACCESS_ADMIN_TOKEN_SIGNATURE = process.env
    .ACCESS_ADMIN_TOKEN_SIGNATURE;
exports.ACCESS_USER_TOKEN_SIGNATURE = process.env
    .ACCESS_USER_TOKEN_SIGNATURE;
exports.ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800");
exports.REFRESH_ADMIN_TOKEN_SIGNATURE = process.env
    .REFRESH_ADMIN_TOKEN_SIGNATURE;
exports.REFRESH_USER_TOKEN_SIGNATURE = process.env
    .REFRESH_USER_TOKEN_SIGNATURE;
exports.REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN ?? "31536000");
exports.WEB_CLIENT_IDS = process.env.WEB_CLIENT_IDS?.split(",") || [];
exports.APP_PASSWORD = process.env.APP_PASSWORD;
exports.APP_EMAIL = process.env.APP_EMAIL;
exports.FACEBOOK = process.env.FACEBOOK;
exports.TWITTER = process.env.TWITTER;
exports.INSTAGRAM = process.env.INSTAGRAM;
exports.OTP_EXPIRES_TIME = parseInt(process.env.OTP_EXPIRES_TIME ?? "120");
exports.BLOCK_OTP_TIME = parseInt(process.env.BLOCK_OTP_TIME ?? "300");
exports.MAX_OTP_TRIALS = parseInt(process.env.MAX_OTP_TRIALS ?? "3");
exports.MAX_INCORRECT_PASSWORD_ATTEMPTS = parseInt(process.env.MAX_INCORRECT_PASSWORD_ATTEMPTS ?? "5");
exports.PAGINATION_LIMIT = parseInt(process.env.PAGINATION_LIMIT ?? "5");
exports.PAGE = parseInt(process.env.PAGE ?? "1");
exports.USER_PROFILE_CACHE_TTL = parseInt(process.env.USER_PROFILE_CACHE_TTL ?? "86400");
exports.default = {
    NODE_ENV: exports.NODE_ENV,
    PORT: exports.PORT,
    APPLICATION_NAME: exports.APPLICATION_NAME,
    WEBSITE_URL: exports.WEBSITE_URL,
    DB_URI: exports.DB_URI,
    DB_REDIS_URI: exports.DB_REDIS_URI,
    SALT_ROUND: exports.SALT_ROUND,
    ENC_KEY: exports.ENC_KEY,
    IV_LENGTH: exports.IV_LENGTH,
    ACCESS_ADMIN_TOKEN_SIGNATURE: exports.ACCESS_ADMIN_TOKEN_SIGNATURE,
    ACCESS_USER_TOKEN_SIGNATURE: exports.ACCESS_USER_TOKEN_SIGNATURE,
    ACCESS_TOKEN_EXPIRES_IN: exports.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_ADMIN_TOKEN_SIGNATURE: exports.REFRESH_ADMIN_TOKEN_SIGNATURE,
    REFRESH_USER_TOKEN_SIGNATURE: exports.REFRESH_USER_TOKEN_SIGNATURE,
    REFRESH_TOKEN_EXPIRES_IN: exports.REFRESH_TOKEN_EXPIRES_IN,
    WEB_CLIENT_IDS: exports.WEB_CLIENT_IDS,
    APP_PASSWORD: exports.APP_PASSWORD,
    APP_EMAIL: exports.APP_EMAIL,
    FACEBOOK: exports.FACEBOOK,
    TWITTER: exports.TWITTER,
    INSTAGRAM: exports.INSTAGRAM,
    OTP_EXPIRES_TIME: exports.OTP_EXPIRES_TIME,
    BLOCK_OTP_TIME: exports.BLOCK_OTP_TIME,
    MAX_OTP_TRIALS: exports.MAX_OTP_TRIALS,
    MAX_INCORRECT_PASSWORD_ATTEMPTS: exports.MAX_INCORRECT_PASSWORD_ATTEMPTS,
    PAGINATION_LIMIT: exports.PAGINATION_LIMIT,
    PAGE: exports.PAGE,
    USER_PROFILE_CACHE_TTL: exports.USER_PROFILE_CACHE_TTL,
};
