import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { enums, exceptions, translate, type TranslationKey } from "../common";
import configService from "../config.service";

// * using IError
export const globalErrorHandling = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  let status = 500;
  let message = error.message as TranslationKey;
  let issues: unknown;

  // Our own exceptions (BadRequestException, NotFoundException, ...)
  if (error instanceof exceptions.ApplicationException) {
    status = error.status;
    // validation.middleware sends the zod issues as the cause
    issues = error.cause;
  }
  // Mongoose schema rule was broken (required / minLength / enum ...)
  else if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "validation.general.error";
    issues = Object.values(error.errors).map((e) => ({
      path: [e.path],
      message: translate(
        req.lang,
        e instanceof mongoose.Error.CastError
          ? "validation.general.invalidType"
          : (e.message as TranslationKey),
      ),
    }));
  }
  // Duplicate value on a unique field (e.g. email)
  else if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    status = 409;
    const field = Object.keys(error.keyPattern ?? {})[0];
    const key = `error.duplicate.${field}` as TranslationKey;
    message =
      translate(enums.LanguageEnum.EN, key) === key
        ? "error.duplicate.default"
        : key;
  }
  // Value does not match the field type, e.g. an invalid ObjectId
  else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = "error.invalidId";
  }

  const isProduction = configService.NODE_ENV == "production";
  const defaultErrorMessage: TranslationKey = "error.server";
  const displayErrorMessage = message || defaultErrorMessage;

  return res.status(status).json({
    status_code: status,
    message: translate(
      req.lang,
      isProduction && status == 500 ? defaultErrorMessage : displayErrorMessage,
    ),
    issues,
    stack: isProduction ? undefined : error.stack,
  });
};
