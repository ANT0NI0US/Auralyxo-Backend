import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV: string = process.env.NODE_ENV ?? "development";

config({ path: resolve(`./.env.${NODE_ENV}`) });

// GENERAL
export const PORT: number = parseInt(process.env.PORT ?? "4000");
export const APPLICATION_NAME: string = process.env.APPLICATION_NAME as string;
export const WEBSITE_URL: string = `${process.env.WEBSITE_URL}${PORT}/`;

// DATABASE
const DB_URL: string = process.env.DB_URL_ATLAS as string;
const DB_NAME: string = process.env.DB_NAME || "Auralyxo";
export const DB_URI: string = `${DB_URL}/${DB_NAME}`;
export const DB_REDIS_URI: string = process.env.DB_REDIS_URI as string;

// security (Hashing , Encryption)
export const SALT_ROUND: number = parseInt(process.env.SALT_ROUND ?? "12");
export const ENC_KEY: string = process.env.ENC_KEY as string;
export const IV_LENGTH: number = parseInt(process.env.IV_LENGTH ?? "16");

// ACCESS TOKEN (USER , ADMIN)
export const ACCESS_ADMIN_TOKEN_SIGNATURE: string = process.env
  .ACCESS_ADMIN_TOKEN_SIGNATURE as string;
export const ACCESS_USER_TOKEN_SIGNATURE: string = process.env
  .ACCESS_USER_TOKEN_SIGNATURE as string;
export const ACCESS_TOKEN_EXPIRES_IN: number = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800",
);

// REFRESH TOKEN (USER , ADMIN)
export const REFRESH_ADMIN_TOKEN_SIGNATURE: string = process.env
  .REFRESH_ADMIN_TOKEN_SIGNATURE as string;
export const REFRESH_USER_TOKEN_SIGNATURE: string = process.env
  .REFRESH_USER_TOKEN_SIGNATURE as string;
export const REFRESH_TOKEN_EXPIRES_IN: number = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "31536000",
);

// GOOGLE ACCOUNT
export const WEB_CLIENT_IDS: string[] =
  process.env.WEB_CLIENT_IDS?.split(",") ?? [];

// SEND EMAIL
export const APP_PASSWORD: string = process.env.APP_PASSWORD as string;
export const APP_EMAIL: string = process.env.APP_EMAIL as string;
export const FACEBOOK: string = process.env.FACEBOOK as string;
export const TWITTER: string = process.env.TWITTER as string;
export const INSTAGRAM: string = process.env.INSTAGRAM as string;
export const OTP_EXPIRES_TIME: number = parseInt(
  process.env.OTP_EXPIRES_TIME ?? "120",
);
export const BLOCK_OTP_TIME: number = parseInt(
  process.env.BLOCK_OTP_TIME ?? "300",
);
export const MAX_OTP_TRIALS: number = parseInt(
  process.env.MAX_OTP_TRIALS ?? "3",
);
export const MAX_OTP_ATTEMPTS: number = parseInt(
  process.env.MAX_OTP_ATTEMPTS ?? "5",
);

// LOGIN
export const MAX_INCORRECT_PASSWORD_ATTEMPTS: number = parseInt(
  process.env.MAX_INCORRECT_PASSWORD_ATTEMPTS ?? "5",
);

// PAGINATION
export const PAGINATION_LIMIT: number = parseInt(
  process.env.PAGINATION_LIMIT ?? "5",
);
export const PAGE: number = parseInt(process.env.PAGE ?? "1");

// CACHING
export const USER_PROFILE_CACHE_TTL: number = parseInt(
  process.env.USER_PROFILE_CACHE_TTL ?? "86400",
);

export default {
  NODE_ENV,
  PORT,
  APPLICATION_NAME,
  WEBSITE_URL,
  DB_URI,
  DB_REDIS_URI,
  SALT_ROUND,
  ENC_KEY,
  IV_LENGTH,
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_USER_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_USER_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  WEB_CLIENT_IDS,
  APP_PASSWORD,
  APP_EMAIL,
  FACEBOOK,
  TWITTER,
  INSTAGRAM,
  OTP_EXPIRES_TIME,
  BLOCK_OTP_TIME,
  MAX_OTP_TRIALS,
  MAX_OTP_ATTEMPTS,
  MAX_INCORRECT_PASSWORD_ATTEMPTS,
  PAGINATION_LIMIT,
  PAGE,
  USER_PROFILE_CACHE_TTL,
};
