import { NextFunction, Request, Response } from "express";
import { enums, exceptions, services } from "../common";

export const bearerAuth = async ({
  req,
  tokenType = enums.TokenTypeEnum.ACCESS,
}: {
  req: Request;
  tokenType: enums.TokenTypeEnum;
}) => {
  const [_, credential] = req.headers["authorization"]?.split(" ") || [];
  const { user, payload } = await services.tokenService.decodeToken({
    authorization: credential as string,
    tokenType,
  });
  req.user = user;
  req.payload = payload;
};

export const authentication = ({
  tokenType = enums.TokenTypeEnum.ACCESS,
  allowBasic = true,
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new exceptions.UnauthorizedException("error.unauthorized");
    }
    const [key, credential] = (authorization?.split(" ") || []) as [
      string,
      string,
    ];

    switch (key) {
      case enums.AuthEnum.BEARER:
        await bearerAuth({ req, tokenType });
        break;

      case enums.AuthEnum.BASIC: {
        if (!allowBasic) {
          throw new exceptions.BadRequestException("error.basicAuthNotAllowed");
        }
        // "Basic" without credentials
        if (!credential) {
          throw new exceptions.UnauthorizedException("error.unauthorized");
        }

        const decoded = Buffer.from(credential, "base64").toString();
        // split on the first ":" only, the password itself may contain ":"
        const separator = decoded.indexOf(":");
        if (separator == -1) {
          throw new exceptions.UnauthorizedException(
            "error.invalidCredentials",
          );
        }

        req.user = await services.tokenService.basicAuth({
          email: decoded.slice(0, separator),
          password: decoded.slice(separator + 1),
        });
        break;
      }

      default:
        throw new exceptions.BadRequestException("error.invalidAuthKey");
    }

    next();
  };
};
