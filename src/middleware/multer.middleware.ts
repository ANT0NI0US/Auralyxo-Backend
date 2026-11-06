import { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { exceptions, fileUpload, type TranslationKey } from "../common";

// multer error code → our translation key
const multerErrorKeys: Partial<Record<multer.ErrorCode, TranslationKey>> = {
  LIMIT_FILE_SIZE: "error.fileTooLarge", // from maxFileSize.
  LIMIT_FILE_COUNT: "error.tooManyFiles", // send files more than that we set to it.
  LIMIT_UNEXPECTED_FILE: "error.unexpectedFileField", // add the files to an incorrect field name.
};

export const fileUploadMiddleware = ({
  isRequired = true,
  customPath = "general",
  multerMiddleware,
  validation = [],
}: {
  isRequired?: boolean;
  customPath?: string;
  multerMiddleware: RequestHandler;
  validation?: readonly string[];
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (error?: any) => {
      try {
        if (error) {
          const key =
            error instanceof multer.MulterError
              ? multerErrorKeys[error.code]
              : undefined;
          throw new exceptions.BadRequestException(
            key ?? "error.invalidUpload",
          );
        }
        if (
          isRequired &&
          !req.file &&
          !(Array.isArray(req.files) && req.files.length > 0) &&
          !(typeof req.files == "object" && Object.keys(req.files).length > 0)
        ) {
          throw new exceptions.BadRequestException("error.fileRequired");
        }
        await fileUpload.multerUpload({ req, customPath, validation });
        next();
      } catch (error: any) {
        next(error);
      }
    });
  };
};
