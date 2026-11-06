import express from "express";
import { translate } from "./common";
import { BootstrapDB } from "./DB/connection.db";
import * as middleware from "./middleware";
import * as modules from "./modules";
import cors from "cors";

/*
 * There is another two solutions

? 1)
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Application = express();

app.all(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    return res.status(200).json({ message: "Done" });
  },
);

? 2)
import express from "express";
import type { Application, Request, Response, NextFunction } from "express";

const app: Application = express();

app.all(
  "/",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    return res.status(200).json({ message: "Done" });
  },
);
*/

const app: express.Application = express();
BootstrapDB(app);

app.use(cors(), middleware.language, express.json());
app.use("/assets", express.static("./assets"));

app.all(
  "/",
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): express.Response => {
    return res.status(200).json({ message: "Done" });
  },
);

app.use("/auth", modules.authController);
app.use("/user", modules.userController);

app.all(
  "{/*dummy}",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({
      message: translate(req.lang, "error.routeNotFound"),
    });
  },
);

app.use(middleware.globalErrorHandling);
