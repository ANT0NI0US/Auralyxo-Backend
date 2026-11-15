import type { NextFunction, Request, Response } from "express";
import { translate } from "../common";

export const welcome = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  return res
    .status(200)
    .json({ message: translate(req.lang, "success.welcome") });
};
