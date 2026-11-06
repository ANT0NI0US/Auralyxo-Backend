import { ApplicationException } from "./main.exception";

export class BadRequestException extends ApplicationException {
  constructor(message: string = "Bad Request Exception", cause?: unknown) {
    super(message, 400, cause);
  }
}

export class TooManyRequestException extends ApplicationException {
  constructor(message: string = "Too Many Request Exception", cause?: unknown) {
    super(message, 429, cause);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = "Conflict Exception", cause?: unknown) {
    super(message, 409, cause);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = "Unauthorized Exception", cause?: unknown) {
    super(message, 401, cause);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string = "Not Found Exception", cause?: unknown) {
    super(message, 404, cause);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string = "Forbidden Exception", cause?: unknown) {
    super(message, 403, cause);
  }
}
