import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import morgan from "morgan";
import { pipeline } from "node:stream";
import { promisify } from "node:util"; // dyh ms2ola 3n any hya bta5od ay function m4 bt3ml async w t5lyha tb2a async function.
import { exceptions, limiter, services, translate } from "./common";
import configService from "./config.service";
import { BootstrapDB } from "./DB/connection.db";
import * as middleware from "./middleware";
import * as modules from "./modules";
// import { notificationService } from "./common/services";

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
app.use("/assets", express.static("./assets")); // TODO remove this
app.get(
  `/uploads/pre-signed/*path`,
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.params?.path) {
      throw new exceptions.BadRequestException("error.missingAssetUrl");
    }
    const assetPath = req.params.path as string[];

    const Key: string = assetPath.join("/");
    // filename like "totos.png"
    const { download = "false", filename = assetPath.pop() } = req.query as {
      download?: "true" | "false";
      filename?: string;
    };
    const url = await services.cloudService.createFetchPreSignedAssetLink({
      Key,
      download,
      filename,
    });

    return res.json({ message: translate(req.lang, "success.done"), url });
  },
);
// kdh a7na 2olna eh b3d al uploads ay 7aga htt7at fy al path fa 34an kdh 3mlna req.params.path
app.get(
  `/uploads/*path`,
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.params?.path) {
      throw new exceptions.BadRequestException("error.missingAssetUrl");
    }

    const assetPath = req.params.path as string[];

    const Key: string = assetPath.join("/");
    // filename like "totos.png"
    const { download = "false", filename = assetPath.pop() } = req.query as {
      download?: "true" | "false";
      filename?: string;
    };
    const { Body, ContentType } = await services.cloudService.getAsset({ Key });

    if (!Body) {
      throw new exceptions.BadRequestException("error.failToFetchAsset");
    }

    // dyh b2ol any ayan kan al origin aly hyb3t al request m3nde4 ay mo4kla m3ah
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (download == "true") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      ); // apply this in download only
    }
    // tyb dh by2olk eh by2olk an al content type aly gylk dh mn no3 eh bm3na an al contentType dh msln gy image/png fa al motsf7 y3rf an dyh image tb lw mfe4 contentType hy5lyha b "application/octet-stream" w m3naha bytes mn no3 m4 m3rof w fy al 7ala dyh hwa by3mla download.
    res.setHeader("Content-Type", ContentType || "application/octet-stream");
    return await s3WriteResponse(Body as NodeJS.ReadableStream, res);

    // return res.status(200).json({
    //   message: translate(req.lang, "success.welcome"),
    //   // * using params
    //   // data: (req.params.path as unknown as string[]).join("/"),
    //   // * using query
    //   // data: req.query.path,
    //   data: response,
    // });
  },
);

app.all("/", middleware.welcome);

// app.post(
//   "/send-notification",
//   async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<Response> => {
//     await notificationService.sendNotification({
//       token: req.body.token,
//       notification: { title: "First", body: "Hello World" },
//     });

//     return res.status(200).json({ message: "Welcome", data: req.body });
//   },
// );

app.use("/auth", modules.authController);
app.use("/user", modules.userController);
app.use("/notification", modules.notificationController);

app.all("{/*dummy}", middleware.notFound);

app.use(middleware.globalErrorHandling);
