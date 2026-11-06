"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.language = void 0;
const common_1 = require("../common");
const language = (req, res, next) => {
    const requested = Number(req.headers["accept-language"]);
    req.lang = Object.values(common_1.enums.LanguageEnum).includes(requested)
        ? requested
        : common_1.enums.LanguageEnum.EN;
    next();
};
exports.language = language;
