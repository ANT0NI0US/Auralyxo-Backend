"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseFormatter = void 0;
const common_1 = require("../common");
const responseFormatter = (handler) => {
    return async (req, res, next) => {
        const result = await handler(req, res, next);
        if (res.headersSent)
            return;
        const { status = 200, message = "success.done", data, extra, } = result ?? {};
        return res
            .status(status)
            .json({ message: (0, common_1.translate)(req.lang, message), data, extra });
    };
};
exports.responseFormatter = responseFormatter;
