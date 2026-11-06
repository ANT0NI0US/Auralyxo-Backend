"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_service_1 = __importDefault(require("../../config.service"));
const encrypt = async (plainText) => {
    const iv = node_crypto_1.default.randomBytes(config_service_1.default.IV_LENGTH);
    const cipherIv = node_crypto_1.default.createCipheriv("aes-256-cbc", config_service_1.default.ENC_KEY, iv);
    let cipherText = cipherIv.update(plainText, "utf-8", "hex");
    cipherText += cipherIv.final("hex");
    return `${iv.toString("hex")}:${cipherText}`;
};
exports.encrypt = encrypt;
const decrypt = async (cipherText) => {
    const [iv, encryptedText] = cipherText.split(":");
    const binaryLikeIv = Buffer.from(iv, "hex");
    const decipherIv = node_crypto_1.default.createDecipheriv("aes-256-cbc", config_service_1.default.ENC_KEY, binaryLikeIv);
    let plainText = decipherIv.update(encryptedText, "hex", "utf8");
    plainText += decipherIv.final("utf-8");
    return plainText;
};
exports.decrypt = decrypt;
