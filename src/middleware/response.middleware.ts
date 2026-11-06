import { NextFunction, Request, RequestHandler, Response } from "express";
import { itf, translate } from "../common";

export const responseFormatter = (handler: Function): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const result = await handler(req, res, next);

    if (res.headersSent) return;

    const {
      status = 200,
      message = "success.done",
      data,
      extra,
    }: itf.IResponse = result ?? {};
    return res
      .status(status)
      .json({ message: translate(req.lang, message), data, extra });
  };
};
