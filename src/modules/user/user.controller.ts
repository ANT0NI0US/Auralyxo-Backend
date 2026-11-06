import { NextFunction, Request, Response, Router } from "express";
import { enums, fileUpload, itf } from "../../common";
import * as middleware from "../../middleware";
import us from "./user.service";
import * as validators from "./user.validation";

const router = Router({ caseSensitive: true, strict: true });

// -------------------------------------------------- PROFILE --------------------------------------------------- //
router.get(
  "/profile",
  middleware.authentication(),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const user = await us.profile({ user: req.user });
      return { message: "success.userRetrieved", data: user };
    },
  ),
);
// -------------------------------------------------- GET ALL USERS --------------------------------------------------- //
router.get(
  "/all",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.getAllUsers),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const users = await us.allUsers({
        query: req.validate.query,
      });
      return { message: "success.usersRetrieved", data: users };
    },
  ),
);
// -------------------------------------------------- UPDATE USER --------------------------------------------------- //
router.patch(
  "/update",
  middleware.authentication(),
  middleware.validation(validators.update),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const updatedUser = await us.updateUser({
        user: req.user,
        updatedData: req.validate.body,
      });

      return { message: "success.userUpdated", data: updatedUser };
    },
  ),
);
// -------------------------------------------------- SHARE PROFILE --------------------------------------------------- //
router.get(
  "/:userId/share-profile",
  middleware.validation(validators.shareProfile),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const user = await us.shareProfile({ params: req.validate.params });

      return { message: "success.userRetrieved", data: user };
    },
  ),
);
// -------------------------------------------------- PROFILE IMAGE --------------------------------------------------- //
router.patch(
  "/profile-image",
  middleware.authentication(),
  middleware.fileUploadMiddleware({
    isRequired: true,
    customPath: "User",
    multerMiddleware: fileUpload.createUploader({}).single("attachment"),
    validation: fileUpload.fileValidation.image,
  }),
  middleware.validation(validators.profileImage),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const image = await us.profileImage({
        user: req.user,
        file: req.validate.file,
      });

      return { message: "success.profileImageUpdated", data: image };
    },
  ),
);
// -------------------------------------------------- UPDATE STATUS --------------------------------------------------- //
router.patch(
  "/:userId/status",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.toggleAccountStatus),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const data = await us.updateStatus({
        admin: req.user,
        params: req.validate.params,
        body: req.validate.body,
      });

      return { message: "success.userStatusUpdated", data };
    },
  ),
);
// -------------------------------------------------- DELETE USER (ADMIN) --------------------------------------------------- //
router.delete(
  "/:userId",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.deleteUser),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await us.deleteUser({
        admin: req.user,
        params: req.validate.params,
      });

      return { message: "success.userDeleted" };
    },
  ),
);

export default router;
