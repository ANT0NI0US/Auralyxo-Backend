import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import configService from "./config.service";
import { BootstrapDB } from "./DB/connection.db";
import * as middleware from "./middleware";
import * as modules from "./modules";
import {
  limiter,
  services,
  // , translate
} from "./common";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { notificationService } from "./common/services";

const s3WriteResponse = promisify(pipeline);

if (configService.NODE_ENV != "development") {
  console.log = () => {};
}

const app: express.Application = express();
BootstrapDB(app);

const limiterMiddleware = limiter.generateRateLimiter();

app.set("trust proxy", true);

app.use(
  cors(),
  helmet(),
  morgan("dev"),
  middleware.language,
  limiterMiddleware,
  express.json(),
);
app.use("/assets", express.static("./assets"));
app.get(
  `/uploads/pre-signed/*path`,
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const Key: string = (req.params.path as unknown as string[]).join("/");
    // filename like "totos.png"
    const {
      download = "false",
      filename = (req.params.path as string[]).pop(),
    } = req.query as { download?: "true" | "false"; filename?: string };
    const url = await services.cloudService.createFetchPreSignedAssetLink({
      Key,
      download,
      filename,
    });

    return res.json({ message: "Done", url });
  },
);
// kdh a7na 2olna eh b3d al uploads ay 7aga htt7at fy al path fa 34an kdh 3mlna req.params.path
app.get(
  `/uploads/*path`,
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const Key: string = (req.params.path as string[]).join("/");
    // filename like "totos.png"
    const {
      download = "false",
      filename = (req.params.path as string[]).pop(),
    } = req.query as { download?: "true" | "false"; filename?: string };
    const { Body, ContentType } = await services.cloudService.getAsset({ Key });
    // return res.status(200).json({
    //   message: translate(req.lang, "success.welcome"),
    //   // * using params
    //   // data: (req.params.path as unknown as string[]).join("/"),
    //   // * using query
    //   // data: req.query.path,
    //   data: response,
    // });

    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (download == "true") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      ); // apply this in download only
    }
    res.setHeader("Content-Type", ContentType || "application/octet-stream");
    return await s3WriteResponse(Body as NodeJS.ReadableStream, res);
  },
);

app.all("/", middleware.welcome);

app.post(
  "/send-notification",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    await notificationService.sendNotification({
      token: req.body.token,
      title: "First",
      body: "Hello World",
    });

    return res.status(200).json({ message: "Welcome", data: req.body });
  },
);

app.use("/auth", modules.authController);
app.use("/user", modules.userController);

app.all("{/*dummy}", middleware.notFound);

app.use(middleware.globalErrorHandling);
