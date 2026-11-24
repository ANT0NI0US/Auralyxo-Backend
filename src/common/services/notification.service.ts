import { type App, cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
// import { readFileSync } from "node:fs";
// import { resolve } from "node:path";
import { type tps } from "../../common";
import configService from "../../config.service";
import { type CacheService, cacheService } from "./cache.service";

export class NotificationService {
  private readonly _app: App;
  private readonly _cacheService: CacheService;

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
    this._app = initializeApp({
      credential: cert(secretFile),
    });
    this._cacheService = cacheService;
  }

  userKey({ userId }: { userId: tps.IdType }) {
    return `user:FCM:${userId.toString()}`;
  }

  async addFCM({ userId, FCMToken }: { userId: tps.IdType; FCMToken: string }) {
    return await this._cacheService.addToSet({
      key: this.userKey({ userId }),
      value: FCMToken,
    });
  }

  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: tps.IdType;
    FCMToken: string;
  }) {
    return await this._cacheService.removeFromSet({
      key: this.userKey({ userId }),
      value: FCMToken,
    });
  }

  async getFCMs({ userId }: { userId: tps.IdType }) {
    return await this._cacheService.getMembers({
      key: this.userKey({ userId }),
    });
  }

  async hasFCMs({ userId }: { userId: tps.IdType }) {
    return await this._cacheService.hasMembers({
      key: this.userKey({ userId }),
    });
  }

  async removeFCMUser({ userId }: { userId: tps.IdType }) {
    return await this._cacheService.del({
      key: this.userKey({ userId }),
    });
  }

  async sendNotification({
    token,
    notification,
  }: {
    token: string;
    notification: { title: string; body: string; imageUrl?: string };
  }) {
    return getMessaging(this._app).send({
      token,
      notification,
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
    // first approach
    await Promise.allSettled(
      tokens.map((token) => {
        return this.sendNotification({ token, notification: { title, body } });
      }),
    );

    // second approach
    // let messages = tokens.map((token) => {
    //   return {
    //     token,
    //     notification: {
    //       title,
    //       body,
    //     },
    //   };
    // });
    // return getMessaging(this._app).sendEach(messages);
  }
}

export const notificationService = new NotificationService();
