import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

export type TokenPayloadType = JwtPayload & {
  sub: string | mongoose.Types.ObjectId;
  aud: string[];
  jti: string;
  iat: number;
};
