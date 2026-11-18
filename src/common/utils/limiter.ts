import type { NextFunction, Request, Response } from "express";
import {
  ipKeyGenerator,
  rateLimit,
  type DraftHeadersVersion,
  type IncrementCallback,
} from "express-rate-limit";
import configService from "../../config.service.js";
import { ApplicationException } from "../exceptions";
import { cacheService } from "../services/cache.service";
import type { TranslationKey } from "../translate";

export const generateRateLimiter = ({
  ttl = 15,
  standardHeaders = "draft-8",
  message = "error.tooManyRequests",
  status = 429,
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
  limit = 1000,
}: {
  ttl?: number;
  standardHeaders?: DraftHeadersVersion;
  message?: TranslationKey;
  status?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  limit?: number;
} = {}) => {
  return rateLimit({
    windowMs: ttl * 60 * 1000,
    handler: function (req: Request, res: Response, next: NextFunction) {
      return next(new ApplicationException(message, status));
    },
    legacyHeaders: configService.NODE_ENV == "development" ? true : false,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders,
    limit,
    keyGenerator: function (req: Request) {
      const ip = ipKeyGenerator(req.ip as string, 52);
      return `${ip}::${req.path}`;
    },
    store: {
      async incr(key: string, cb: IncrementCallback) {
        try {
          const count = await cacheService.incrBy({ key });
          let secondsRemaining = ttl * 60;
          if (count === 1) {
            await cacheService.expire({ key, ttl: secondsRemaining });
          } else {
            secondsRemaining = await cacheService.ttl({ key });
          }
          const resetTime = new Date(Date.now() + secondsRemaining * 1000);
          cb(undefined, count, resetTime);
        } catch (error) {
          cb(error as Error, 0, undefined);
        }
      },
      async decrement(key: string) {
        if (await cacheService.exist({ key })) {
          await cacheService.incrBy({ key, value: -1 });
        }
      },
      // required by the store type (express-rate-limit calls it on limiter.resetKey)
      async resetKey(key: string) {
        await cacheService.del({ key });
      },
    },
  });
};
