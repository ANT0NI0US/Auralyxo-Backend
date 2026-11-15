import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import configService from "./config.service";
import { BootstrapDB } from "./DB/connection.db";
import * as middleware from "./middleware";
import * as modules from "./modules";

if (configService.NODE_ENV != "development") {
  console.log = () => {};
}

const app: express.Application = express();
BootstrapDB(app);

app.use(cors(), helmet(), morgan("dev"), middleware.language, express.json());
app.use("/assets", express.static("./assets"));

app.all("/", middleware.welcome);

app.use("/auth", modules.authController);
app.use("/user", modules.userController);

app.all("{/*dummy}", middleware.notFound);

app.use(middleware.globalErrorHandling);
