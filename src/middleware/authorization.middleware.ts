import { NextFunction, Request, Response } from "express";
import { enums, exceptions } from "../common";

/*
SINGLE
authorization(RoleEnum.ADMIN)
*/
export const authorization = ({
  accessRole,
}: {
  accessRole: enums.RoleEnum;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role < accessRole) {
      throw new exceptions.ForbiddenException("error.forbidden");
    }

    next();
  };
};
