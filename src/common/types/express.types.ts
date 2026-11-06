import { enums, tps } from "../../common";
import { models } from "../../DB";

declare module "express-serve-static-core" {
  interface Request {
    validate: any;
    lang: enums.LanguageEnum;
    user: models.HUser;
    payload: tps.TokenPayloadType;
  }
}
