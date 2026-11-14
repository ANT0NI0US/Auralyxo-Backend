import type { Application } from "express";
import mongoose from "mongoose";
import { models } from ".";
import { services } from "../common";
import configService from "../config.service";

export const BootstrapDB = async (app: Application) => {
  try {
    await mongoose.connect(configService.DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.info("DB CONNECTED 💥");

    if (configService.NODE_ENV === "development") {
      await models.UserModel.syncIndexes();
      await models.FollowModel.syncIndexes();
    }

    await services.cacheService.connectRedis();
    app.listen(configService.PORT, () => {
      console.info(`we are running on port ${configService.PORT}`);
    });
  } catch (error) {
    console.error("FAILED TO CONNECT DB ✖");
    console.error(error);
    process.exit(1);
  }
};
