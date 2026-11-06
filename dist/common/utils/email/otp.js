"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOtp = void 0;
const node_crypto_1 = require("node:crypto");
const createOtp = () => {
    return (0, node_crypto_1.randomInt)(100000, 1000000).toString();
};
exports.createOtp = createOtp;
