import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { enums, fileUpload, type itf } from "../../common";
import * as middleware from "../../middleware";
import us from "./user.service";
import * as validators from "./user.validation";
import type * as entities from "./entities/user.entities";

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
// -------------------------------------------------- GET ALL USERS (ADMIN) --------------------------------------------------- //
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
// -------------------------------------------------- GET ONE USER (ADMIN) --------------------------------------------------- //
router.get(
  "/get-user/:userId",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.getUser),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const user = await us.getUser({
        params: req.validate.params,
      });
      return { message: "success.userRetrieved", data: user };
    },
  ),
);
// -------------------------------------------------- UPDATE PREFERRED LANGUAGE --------------------------------------------------- //
router.patch(
  "/update-language",
  middleware.authentication(),
  middleware.validation(validators.updatePreferredLanguage),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const language = await us.updatePreferredLanguage({
        user: req.user,
        body: req.validate.body,
      });

      return { message: "success.languageUpdated", data: language };
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
// -------------------------------------------------- PENDING FRIEND REQUESTS --------------------------------------------------- //
router.get(
  "/friend-requests",
  middleware.authentication(),
  middleware.validation(validators.getPendingFriendRequests),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const requests = await us.pendingFriendRequests({
        query: req.validate.query,
        user: req.user,
      });

      return {
        message: "success.pendingFriendRequestsRetrieved",
        data: requests,
      };
    },
  ),
);
// -------------------------------------------------- ACTION TO FRIEND REQUEST --------------------------------------------------- //
router.patch(
  "/friend-requests/:userId",
  middleware.authentication(),
  middleware.validation(validators.takeAnActionToFriendRequest),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const message = await us.actionToFriendRequest({
        params: req.validate.params,
        body: req.validate.body,
        user: req.user,
      });

      return { message };
    },
  ),
);
// -------------------------------------------------- SHARE PROFILE --------------------------------------------------- //
router.get(
  "/:userId/share-profile",
  middleware.authentication(),
  middleware.validation(validators.shareProfile),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const user = await us.shareProfile({
        user: req.user,
        params: req.validate.params,
      });

      return { message: "success.userRetrieved", data: user };
    },
  ),
);
// -------------------------------------------------- COVER IMAGES --------------------------------------------------- //
router.patch(
  "/cover-images",
  middleware.authentication(),
  middleware.fileUploadMiddleware({
    customPath: "User/Covers",
    multerMiddleware: fileUpload.createUploader().array("attachments", 5),
    validation: fileUpload.fileValidation.image,
  }),
  middleware.validation(validators.coverImages),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const images = await us.coverImages({
        user: req.user,
        files: req.validate.files,
      });

      return { message: "success.coverImagesUpdated", data: images };
    },
  ),
);
// -------------------------------------------------- PROFILE IMAGE USING S3 BUCKET --------------------------------------------------- //
router.patch(
  "/profile-image",
  middleware.authentication(),
  middleware.fileUploadMiddleware({
    isRequired: true,
    customPath: "User",
    multerMiddleware: fileUpload
      .createUploader({ storageApproach: enums.StorageApproachEnum.DISK })
      .single("attachment"),
    validation: fileUpload.fileValidation.image,
  }),
  middleware.validation(validators.profileImage),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<string>> => {
      const image = await us.profileImage({
        user: req.user,
        file: req.validate.file,
      });

      return { message: "success.profileImageUpdated", data: image };
    },
  ),
);
// --------------------------------- PROFILE IMAGE PRE ASSIGNED USING S3 BUCKET PRE ASSIGNED ---------------------------------------- //
router.patch(
  "/profile-image-pre-assigned",
  middleware.authentication(),
  middleware.validation(validators.profileImagePreAssigned),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse<entities.IProfileImagePreAssignedResponse>> => {
      const { url } = await us.profileImagePreAssigned({
        user: req.user,
        body: req.validate.body,
      });

      return { message: "success.profileImageUpdated", data: { url } };
    },
  ),
);
// -------------------------------------------------- DELETE PROFILE IMAGE --------------------------------------------------- //
router.delete(
  "/profile-image",
  middleware.authentication(),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await us.deleteProfileImage({ user: req.user });

      return { message: "success.profileImageDeleted" };
    },
  ),
);
// -------------------------------------------------- TOGGLE STATUS (ADMIN) --------------------------------------------------- //
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
// -------------------------------------------------- UPDATE VISIBILITY --------------------------------------------------- //
router.patch(
  "/update-visibility",
  middleware.authentication(),
  middleware.validation(validators.toggleVisibility),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const visibility = await us.updateVisibility({
        user: req.user,
        body: req.validate.body,
      });

      return { message: "success.visibilityUpdated", data: visibility };
    },
  ),
);
// -------------------------------------------------- SEND FRIEND REQUEST --------------------------------------------------- //
router.post(
  "/send-friend-request",
  middleware.authentication(),
  middleware.validation(validators.sendFriendRequest),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const friendRequest = await us.sendFriendRequest({
        user: req.user,
        body: req.validate.body,
      });

      return {
        status: 201,
        message: "success.friendRequestSent",
        data: friendRequest,
      };
    },
  ),
);
// -------------------------------------------------- CANCEL FRIEND REQUEST --------------------------------------------------- //
router.delete(
  "/:userId/friend-request",
  middleware.authentication(),
  middleware.validation(validators.cancelFriendRequest),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await us.cancelFriendRequest({
        user: req.user,
        params: req.validate.params,
      });

      return { message: "success.friendRequestCanceled" };
    },
  ),
);
// -------------------------------------------------- FRIENDS --------------------------------------------------- //
router.get(
  "/:userId/friends",
  middleware.authentication(),
  middleware.validation(validators.getFriends),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const friends = await us.friends({
        query: req.validate.query,
        params: req.validate.params,
        user: req.user,
      });

      return { message: "success.friendsRetrieved", data: friends };
    },
  ),
);
// -------------------------------------------------- SEARCH USERS --------------------------------------------------- //
router.get(
  "/search",
  middleware.authentication(),
  middleware.validation(validators.searchUsers),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const users = await us.searchUsers({
        query: req.validate.query,
        user: req.user,
      });

      return { message: "success.searchResults", data: users };
    },
  ),
);
// -------------------------------------------------- SUGGESTIONS --------------------------------------------------- //
router.get(
  "/suggestions",
  middleware.authentication(),
  middleware.validation(validators.getSuggestions),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const suggestions = await us.suggestions({
        query: req.validate.query,
        user: req.user,
      });

      return { message: "success.suggestionsRetrieved", data: suggestions };
    },
  ),
);
// -------------------------------------------------- REMOVE FRIEND --------------------------------------------------- //
router.delete(
  "/remove-friend/:userId",
  middleware.authentication(),
  middleware.validation(validators.removeExistingFriend),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await us.removeExistingFriend({
        user: req.user,
        params: req.validate.params,
      });

      return { message: "success.friendRemoved" };
    },
  ),
);

export default router;
