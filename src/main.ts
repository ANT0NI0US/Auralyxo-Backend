import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { translate } from "./common";
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

app.all(
  "/",
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): express.Response => {
    return res
      .status(200)
      .json({ message: translate(req.lang, "success.welcome") });
  },
);

app.use("/auth", modules.authController);
app.use("/user", modules.userController);

app.all(
  "{/*dummy}",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({
      message: translate(req.lang, "error.routeNotFound")
        .replace("{url}", req.originalUrl)
        .replace("{method}", req.method),
    });
  },
);

app.use(middleware.globalErrorHandling);
