import type { JwtPayload } from "jsonwebtoken";
import type { tps } from "..";

export type TokenPayloadType = JwtPayload & {
  sub: tps.userIdType;
  aud: string[];
  jti: string;
  iat: number;
};
