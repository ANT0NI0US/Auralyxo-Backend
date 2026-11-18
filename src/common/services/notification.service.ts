import { App, cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { Types } from "mongoose";
// import { readFileSync } from "node:fs";
// import { resolve } from "node:path";
import configService from "../../config.service";
import { CacheService, cacheService } from "./cache.service";

type userIdType = Types.ObjectId | string;

export class NotificationService {
  private readonly app: App;
  private cacheService: CacheService;

  constructor() {
    /*
     * using ./src/config/auralyxo-1ce91-firebase-adminsdk-fbsvc-eacf68fb7c.json
    const secretFile = JSON.parse(
      readFileSync(
        resolve(
          "./src/config/auralyxo-1ce91-firebase-adminsdk-fbsvc-eacf68fb7c.json",
        ),
      ) as unknown as string,
    );
    */

    // ? to add it in the .env to not let anyone to access it add to powershell => [Convert]::ToBase64String([IO.File]::ReadAllBytes("src/config/auralyxo-1ce91-firebase-adminsdk-fbsvc-eacf68fb7c.json")) | Set-Clipboard
    const secretFile = JSON.parse(
      Buffer.from(configService.FIREBASE_SERVICE_ACCOUNT, "base64").toString(
        "utf8",
      ),
    );
    this.app = initializeApp({
      credential: cert(secretFile),
    });
    this.cacheService = cacheService;
  }

  userKey({ userId }: { userId: userIdType }) {
    return `user:FCM:${userId.toString()}`;
  }

  async addFCM({ userId, FCMToken }: { userId: userIdType; FCMToken: string }) {
    return await this.cacheService.addToSet({
      key: this.userKey({ userId }),
      value: FCMToken,
    });
  }

  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: userIdType;
    FCMToken: string;
  }) {
    return await this.cacheService.removeFromSet({
      key: this.userKey({ userId }),
      value: FCMToken,
    });
  }

  async getFCMs({ userId }: { userId: userIdType }) {
    return await this.cacheService.getMembers({
      key: this.userKey({ userId }),
    });
  }

  async hasFCMs({ userId }: { userId: userIdType }) {
    return await this.cacheService.hasMembers({
      key: this.userKey({ userId }),
    });
  }

  async removeFCMUser({ userId }: { userId: userIdType }) {
    return await this.cacheService.del({
      key: this.userKey({ userId }),
    });
  }

  async sendNotification({
    token,
    title,
    body,
  }: {
    token: string;
    title: string;
    body: string;
  }) {
    return getMessaging(this.app).send({
      token,
      notification: { title, body },
    });
  }

  async sendNotifications({
    tokens,
    title,
    body,
  }: {
    tokens: string[];
    title: string;
    body: string;
  }) {
    await Promise.allSettled(
      tokens.map((token) => {
        return this.sendNotification({ token, title, body });
      }),
    );
  }
}

export const notificationService = new NotificationService();
