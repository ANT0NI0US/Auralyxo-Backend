"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const common_1 = require("../common");
const authorization = ({ accessRole, }) => {
    return async (req, res, next) => {
        if (req.user.role < accessRole) {
            throw new common_1.exceptions.ForbiddenException("error.forbidden");
        }
        next();
    };
};
exports.authorization = authorization;
