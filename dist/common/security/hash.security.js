"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.hash = void 0;
const argon2_1 = __importDefault(require("argon2"));
const hash = async ({ plainText, }) => {
    if (typeof plainText !== "string") {
        plainText = String(plainText);
    }
    const cipherText = await argon2_1.default.hash(plainText);
    return cipherText;
};
exports.hash = hash;
const compare = async ({ plainText, cipherText, }) => {
    return await argon2_1.default.verify(cipherText, plainText);
};
exports.compare = compare;
