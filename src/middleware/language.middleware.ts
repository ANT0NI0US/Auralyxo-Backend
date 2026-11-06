import { NextFunction, Request, Response } from "express";
import { enums } from "../common";

export const language = (req: Request, res: Response, next: NextFunction) => {
  const requested = Number(req.headers["accept-language"]);
  req.lang = Object.values(enums.LanguageEnum).includes(requested)
    ? requested
    : enums.LanguageEnum.EN;
  next();
};
