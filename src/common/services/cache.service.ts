import { createClient, type RedisClientType } from "redis";
import configService from "../../config.service";

export class CacheService {
  private readonly _client: RedisClientType;
  constructor() {
    this._client = createClient({ url: configService.DB_REDIS_URI });
    // without this listener a dropped connection crashes the whole process
    this._client.on("error", (error) => {
      console.error(`Redis error: ${error.message}`);
    });
  }

  async connectRedis() {
    await this._client.connect();
    console.info(`Redis connection stablish successfully`);
  }

  async set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: any;
    ttl?: number | undefined;
  }) {
    if (typeof value == "object") {
      value = JSON.stringify(value);
    }
    return await this._client.set(key, value, { ...(ttl ? { EX: ttl } : {}) });
  }

  async get({ key }: { key: string }) {
    let value = await this._client.get(key);
    try {
      return JSON.parse(value as string);
    } catch (error) {
      return value;
    }
  }

  async exist({ key }: { key: string }) {
    return await this._client.exists(key);
  }

  async update({ key, value, ttl }: { key: string; value: any; ttl?: number }) {
    if (!(await this.exist({ key }))) {
      return 0;
    }
    return await this.set({ key, value, ttl });
  }

  async del({ key }: { key: string | string[] }) {
    return await this._client.del(key);
  }

  async keys({ prefix = "" }: { prefix: string }) {
    return await this._client.keys(`${prefix}*`);
  }

  async ttl({ key }: { key: string }) {
    return await this._client.ttl(key);
  }

  async expire({ key, ttl }: { key: string; ttl: number }) {
    return await this._client.expire(key, ttl);
  }

  async incrBy({ key, value = 1 }: { key: string; value?: number }) {
    return await this._client.incrBy(key, value);
  }

  // --------------------------------------------------------- SETS --------------------------------------------------------------------

  async addToSet({ key, value }: { key: string; value: string }) {
    return await this._client.sAdd(key, value);
  }

  async removeFromSet({ key, value }: { key: string; value: string }) {
    return await this._client.sRem(key, value);
  }

  async getMembers({ key }: { key: string }) {
    return await this._client.sMembers(key);
  }

  async hasMembers({ key }: { key: string }) {
    return await this._client.sCard(key);
  }
}

export const cacheService = new CacheService();
