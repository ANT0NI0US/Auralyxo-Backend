import jwt, { Secret, SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { enums, exceptions, objectId, security, tps } from "../../common";
import configService from "../../config.service";
import { models, queries } from "../../DB";
import { cacheService, CacheService } from "./cache.service";

type UserId = mongoose.Types.ObjectId | string;
type signatureType = {
  accessSignature: string;
  refreshSignature: string;
};

export class TokenService {
  private readonly userRepository: queries.UserRepository;
  private readonly cacheService: CacheService;

  constructor() {
    this.userRepository = new queries.UserRepository();
    this.cacheService = cacheService;
  }

  // USER PROFILE THAT IS STORED IN REDIS
  userBaseProfile({ userId }: { userId: UserId }): string {
    return `User::${userId.toString()}::Profile`;
  }

  // BASE REVOKE TOKEN WE USE IT WHEN WE WANNA TO DELETE ALL LOGIN DEVICES + IN userRevokeToken
  userBaseRevokeToken({ userId }: { userId: UserId }): string {
    return `User::${userId.toString()}::Revoke_Token`;
  }

  // USER REVOKE TOKEN THAT IS STORED IN REDIS
  userRevokeToken({ userId, jti }: { userId: UserId; jti: string }): string {
    return `${this.userBaseRevokeToken({ userId })}::${jti}`;
  }

  // CREATE NEW TOKEN EVEN IF IT'S AN ACCESS OR REFRESH TOKEN
  async createToken({
    payload = {},
    secret = configService.ACCESS_USER_TOKEN_SIGNATURE,
    options = {},
  }: {
    payload: string | Buffer | object;
    secret: Secret;
    options: SignOptions;
  }): Promise<string> {
    return jwt.sign(payload, secret, options);
  }

  // VERIFY THE TOKEN EVEN IF IT'S AN ACCESS OR REFRESH TOKEN
  async verifyToken({
    token = "",
    secret = configService.ACCESS_USER_TOKEN_SIGNATURE,
  }: {
    token: string;
    secret: Secret;
  }): Promise<tps.TokenPayloadType> {
    try {
      return jwt.verify(token, secret) as tps.TokenPayloadType;
    } catch (error: any) {
      // jwt.verify throws its own errors (no cause.status), so they reached the error handler as 500
      // expired token → the frontend should call rotate-token
      if (error.name === "TokenExpiredError") {
        throw new exceptions.UnauthorizedException("error.tokenExpired");
      }
      // wrong signature (forged token / access token sent to rotate-token) or a broken token
      throw new exceptions.UnauthorizedException("error.invalidToken");
    }
  }

  // GET THE ACCESS AND REFRESH TOKEN SIGNATURE DEPENDS ON THE USER ROLE (USER - ADMIN)
  async getTokenSignatures({
    role = enums.RoleEnum.USER,
  }: {
    role?: enums.RoleEnum;
  }): Promise<signatureType> {
    let signatures: signatureType;
    switch (role) {
      case enums.RoleEnum.ADMIN:
        signatures = {
          accessSignature: configService.ACCESS_ADMIN_TOKEN_SIGNATURE,
          refreshSignature: configService.REFRESH_ADMIN_TOKEN_SIGNATURE,
        };
        break;

      default:
        signatures = {
          accessSignature: configService.ACCESS_USER_TOKEN_SIGNATURE,
          refreshSignature: configService.REFRESH_USER_TOKEN_SIGNATURE,
        };
        break;
    }
    return signatures;
  }

  // GET THE ACCESS OR REFRESH TOKEN DEPENDS ON Role AND tokenType
  async getSignature({
    tokenType = enums.TokenTypeEnum.ACCESS,
    role = enums.RoleEnum.USER,
  }: {
    tokenType: enums.TokenTypeEnum;
    role?: enums.RoleEnum;
  }): Promise<string> {
    const { accessSignature, refreshSignature } = await this.getTokenSignatures(
      {
        role,
      },
    );
    return tokenType == enums.TokenTypeEnum.ACCESS
      ? accessSignature
      : refreshSignature;
  }

  async decodeToken({
    authorization = "",
    tokenType = enums.TokenTypeEnum.ACCESS,
  }: {
    authorization?: string;
    tokenType?: enums.TokenTypeEnum;
  } = {}): Promise<{ user: models.HUser; payload: tps.TokenPayloadType }> {
    // decode is using to get the data from the token without knowing the signature
    const decoded = jwt.decode(authorization) as tps.TokenPayloadType;

    if (!decoded?.aud?.length) {
      throw new exceptions.BadRequestException("error.missingTokenPayload");
    }

    const secret = await this.getSignature({
      tokenType,
      role: Number(decoded.aud[0]) as enums.RoleEnum,
    });
    const payload = await this.verifyToken({ token: authorization, secret });

    if (!payload?.sub) {
      throw new exceptions.BadRequestException("error.missingTokenPayload");
    }

    // get an unauthorized exception when the revoked token is already services.exist
    if (
      await this.cacheService.exist({
        key: this.userRevokeToken({ userId: payload.sub, jti: payload.jti }),
      })
    ) {
      throw new exceptions.UnauthorizedException("error.tokenRevoked");
    }

    // check if the user profile is already cached in redis
    const cachedUser = await this.cacheService.get({
      key: this.userBaseProfile({ userId: payload.sub }),
    });

    // the cached value from Redis is a plain object (JSON-parsed), not a real
    // Mongoose document, so .save() and similar methods would be missing.
    // hydrate() rebuilds a real document from it without hitting the database.
    const user = cachedUser
      ? models.UserModel.hydrate(cachedUser)
      : await this.userRepository.findOne({
          filter: {
            _id: objectId.toObjectId({ id: payload.sub }),
            paranoid: false,
          },
        });

    // deleted user → his token is useless
    if (!user) {
      throw new exceptions.UnauthorizedException("error.invalidToken");
    }

    // archived user → same message as login / basic auth
    if (user.status == enums.AccountStatusEnum.ARCHIVE) {
      throw new exceptions.ForbiddenException("error.accountArchived");
    }

    // cache the user profile in redis for 1 day.
    if (!cachedUser) {
      await this.cacheService.set({
        key: this.userBaseProfile({ userId: payload.sub }),
        value: user,
        ttl: configService.USER_PROFILE_CACHE_TTL,
      });
    }

    /*
    - change credentials time contains the time that user is used to logout from all devices so we throw new unauthorized exception
    - use new Date(...) instead of .getTime() directly: when "user" comes from the Redis cache (services.get),
    - changeCredentialsTime is a plain ISO string (JSON-parsed), not a Date instance, so it has no .getTime() method.
    - new Date(...) correctly handles both a Date object (fresh from DB) and a string (from the cache).
    */
    const changeCredentialsTime = user.changeCredentialsTime
      ? new Date(user.changeCredentialsTime).getTime()
      : 0;

    if (Math.floor(changeCredentialsTime / 1000) > payload.iat) {
      throw new exceptions.UnauthorizedException("error.tokenRevoked");
    }

    return { user, payload };
  }

  // CREATE ACCESS AND REFRESH TOKEN
  async createLoginCredentials({
    user,
    options = {},
  }: {
    user: models.HUser;
    options?: SignOptions;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { accessSignature, refreshSignature } = await this.getTokenSignatures(
      {
        role: user.role,
      },
    );
    // this id we will use it in revoked token
    const jwtid = randomUUID();

    const access_token = await this.createToken({
      payload: { sub: user.id },
      secret: accessSignature,
      options: {
        ...options,
        audience: [String(user.role)],
        expiresIn: configService.ACCESS_TOKEN_EXPIRES_IN,
        jwtid,
      },
    });

    const refresh_token = await this.createToken({
      payload: { sub: user.id },
      secret: refreshSignature,
      options: {
        ...options,
        audience: [String(user.role)],
        expiresIn: configService.REFRESH_TOKEN_EXPIRES_IN,
        jwtid,
      },
    });

    return { access_token, refresh_token };
  }

  /*
  CREATE REVOKED TOKEN USING payload
  1- consumedTime: THE TIME THAT FINISHED FROM THE TOKEN IS ALREADY CREATED
  2- refreshExpiresIn: WE GET THE REFRESH EXPIRES IN CAUSE WE PREVENT HIM TO USE IT IN A ROTATE TOKEN
  3- ttl: THE TIME THAT IS REMAINING.
  */
  async createRevokeToken({ payload }: { payload: tps.TokenPayloadType }) {
    // const consumedTime = Math.ceil(Date.now() / 1000 - payload.iat);
    const refreshExpiresIn =
      payload.iat + configService.REFRESH_TOKEN_EXPIRES_IN;
    // const ttl = refreshExpiresIn - consumedTime;
    const ttl = refreshExpiresIn - Math.floor(Date.now() / 1000);
    await this.cacheService.set({
      key: this.userRevokeToken({ userId: payload.sub, jti: payload.jti }),
      value: payload.jti,
      ttl,
    });
    await this.cacheService.del({
      key: this.userBaseProfile({ userId: payload.sub }),
    }); // delete the user profile from redis cache
  }

  async basicAuth({ email, password }: { email: string; password: string }) {
    // Get the account that has the same email and signup with system and the confirmationEmail is true.
    const account = await this.userRepository.findOne({
      filter: {
        email,
        provider: enums.ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
        paranoid: false,
      },
      projection: "+password",
    });

    // If there is no account invalid credentials.
    if (!account) {
      throw new exceptions.ForbiddenException("error.invalidCredentials");
    }

    // Compare between the password that user enter and the actual user password.
    const match = await security.compare({
      plainText: password,
      cipherText: account.password as string,
    });

    if (!match) {
      throw new exceptions.ForbiddenException("error.invalidCredentials");
    }

    if (account.status == enums.AccountStatusEnum.ARCHIVE) {
      throw new exceptions.ForbiddenException("error.accountArchived");
    }

    return account;
  }
}

export const tokenService = new TokenService();
