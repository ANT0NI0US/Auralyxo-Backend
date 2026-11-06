import { NextFunction, Request, Response } from "express";
import { exceptions, enums, translate, type TranslationKey } from "../common";
import type { core, ZodType } from "zod";

// fallback message for the issues that don't have a custom error in the schema itself
const keyFor = (issue: core.$ZodRawIssue): TranslationKey => {
  switch (issue.code) {
    case "invalid_type":
      return issue.input === undefined
        ? "validation.general.required"
        : "validation.general.invalidType";
    case "unrecognized_keys":
      return "validation.general.unrecognizedKeys";
    default:
      return "validation.general.invalid";
  }
};

// ZodType 34an ay wa7da btrg3 z.object
type ValidationInputSchemaType = (lang: enums.LanguageEnum) => ZodType;

export const validation = (schema: ValidationInputSchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationResult = schema(req.lang).safeParse(
      {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        file: req.file,
        files: req.files,
      },
      { error: (issue) => translate(req.lang, keyFor(issue)) },
    );
    if (!validationResult.success) {
      throw new exceptions.BadRequestException(
        "validation.general.error",
        validationResult.error.issues,
      );
    }
    req.validate = validationResult.data as object;
    next();
  };
};
