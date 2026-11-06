import { createClient, RedisClientType } from "redis";
import configService from "../../config.service";

export class CacheService {
  private readonly client: RedisClientType;
  constructor() {
    this.client = createClient({ url: configService.DB_REDIS_URI });
  }

  async connectRedis() {
    try {
      await this.client.connect();
      console.log(`Redis connection stablish successfully`);
    } catch (error) {
      console.log(`Failed to stablish Redis connection`);
    }
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
    return await this.client.set(key, value, { ...(ttl ? { EX: ttl } : {}) });
  }

  async get({ key }: { key: string }) {
    let value = await this.client.get(key);
    try {
      return JSON.parse(value as string);
    } catch (error) {
      return value;
    }
  }

  async exist({ key }: { key: string }) {
    return await this.client.exists(key);
  }

  async update({ key, value, ttl }: { key: string; value: any; ttl?: number }) {
    if (!(await this.exist({ key }))) {
      return 0;
    }
    return await this.set({ key, value, ttl });
  }

  async del({ key }: { key: string | string[] }) {
    return await this.client.del(key);
  }

  async keys({ prefix = "" }: { prefix: string }) {
    return await this.client.keys(`${prefix}*`);
  }

  async ttl({ key }: { key: string }) {
    return await this.client.ttl(key);
  }

  async expire({ key, ttl }: { key: string; ttl: number }) {
    return await this.client.expire(key, ttl);
  }

  async incrBy({ key, value = 1 }: { key: string; value?: number }) {
    return await this.client.incrBy(key, value);
  }
}

export const cacheService = new CacheService();
