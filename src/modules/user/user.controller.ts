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
// -------------------------------------------------- FOLLOW REQUESTS --------------------------------------------------- //
router.get(
  "/follow-requests",
  middleware.authentication(),
  middleware.validation(validators.getFollowRequests),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const requests = await us.followRequests({
        query: req.validate.query,
        user: req.user,
      });

      return { message: "success.followRequestsRetrieved", data: requests };
    },
  ),
);
// -------------------------------------------------- ACTION TO REQUEST --------------------------------------------------- //
router.patch(
  "/follow-requests/:userId",
  middleware.authentication(),
  middleware.validation(validators.takeAnActionToRequest),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const message = await us.actionToRequest({
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
// -------------------------------------------------- PROFILE IMAGE --------------------------------------------------- //
router.patch(
  "/profile-image",
  middleware.authentication(),
  middleware.fileUploadMiddleware({
    isRequired: true,
    customPath: "User",
    multerMiddleware: fileUpload.createUploader().single("attachment"),
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
// -------------------------------------------------- FOLLOW ACCOUNT --------------------------------------------------- //
router.post(
  "/:userId/follow",
  middleware.authentication(),
  middleware.validation(validators.followAccount),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const follow = await us.followAccount({
        user: req.user,
        params: req.validate.params,
      });

      // private account → 202: the request was received but still waits for his approval
      return follow.status == enums.FollowStatusEnum.PENDING
        ? { status: 202, message: "success.followRequestSent", data: follow }
        : { status: 201, message: "success.followed", data: follow };
    },
  ),
);
// -------------------------------------------------- UNFOLLOW ACCOUNT --------------------------------------------------- //
router.delete(
  "/:userId/unfollow",
  middleware.authentication(),
  middleware.validation(validators.unFollowAccount),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await us.unFollowAccount({
        user: req.user,
        params: req.validate.params,
      });

      return { message: "success.unfollowed" };
    },
  ),
);
// -------------------------------------------------- FOLLOWERS --------------------------------------------------- //
router.get(
  "/:userId/followers",
  middleware.authentication(),
  middleware.validation(validators.getFollowers),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const followers = await us.followers({
        query: req.validate.query,
        params: req.validate.params,
        user: req.user,
      });

      return { message: "success.followersRetrieved", data: followers };
    },
  ),
);
// -------------------------------------------------- FOLLOWINGS --------------------------------------------------- //
router.get(
  "/:userId/following",
  middleware.authentication(),
  middleware.validation(validators.getFollowings),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const followings = await us.following({
        query: req.validate.query,
        params: req.validate.params,
        user: req.user,
      });

      return { message: "success.followingRetrieved", data: followings };
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
// -------------------------------------------------- REMOVE FOLLOWER --------------------------------------------------- //
router.delete(
  "/followers/:userId",
  middleware.authentication(),
  middleware.validation(validators.removeExistingFollower),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await us.removeExistingFollower({
        user: req.user,
        params: req.validate.params,
      });

      return { message: "success.followerRemoved" };
    },
  ),
);

export default router;
