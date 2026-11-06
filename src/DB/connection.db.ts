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
    console.log("DB CONNECTED 💥");
    await models.UserModel.syncIndexes();
    await services.cacheService.connectRedis();
    app.listen(configService.PORT, () => {
      console.log(`we are running on port ${configService.PORT}`);
    });
  } catch (error) {
    console.log("FAILED TO CONNECT DB ✖");
    console.log(error);
    process.exit(1);
  }
};
