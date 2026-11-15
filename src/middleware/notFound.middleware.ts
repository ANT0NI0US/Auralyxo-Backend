import type { NextFunction, Request, Response } from "express";
import { exceptions, translate } from "../common";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const message = translate(req.lang, "error.routeNotFound")
    .replace("{url}", req.originalUrl)
    .replace("{method}", req.method);

  throw new exceptions.NotFoundException(message);
};
