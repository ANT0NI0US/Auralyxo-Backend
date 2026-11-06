"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssuer = void 0;
const getIssuer = (req) => {
    return `${req.protocol}://${req.host}`;
};
exports.getIssuer = getIssuer;
