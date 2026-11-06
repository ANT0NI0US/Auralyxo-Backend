"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenException = exports.NotFoundException = exports.UnauthorizedException = exports.ConflictException = exports.TooManyRequestException = exports.BadRequestException = void 0;
const main_exception_1 = require("./main.exception");
class BadRequestException extends main_exception_1.ApplicationException {
    constructor(message = "Bad Request Exception", cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestException = BadRequestException;
class TooManyRequestException extends main_exception_1.ApplicationException {
    constructor(message = "Too Many Request Exception", cause) {
        super(message, 429, cause);
    }
}
exports.TooManyRequestException = TooManyRequestException;
class ConflictException extends main_exception_1.ApplicationException {
    constructor(message = "Conflict Exception", cause) {
        super(message, 409, cause);
    }
}
exports.ConflictException = ConflictException;
class UnauthorizedException extends main_exception_1.ApplicationException {
    constructor(message = "Unauthorized Exception", cause) {
        super(message, 401, cause);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class NotFoundException extends main_exception_1.ApplicationException {
    constructor(message = "Not Found Exception", cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
class ForbiddenException extends main_exception_1.ApplicationException {
    constructor(message = "Forbidden Exception", cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenException = ForbiddenException;
