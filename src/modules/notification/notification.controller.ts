import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { enums, type itf } from "../../common";
import * as middleware from "../../middleware";
import ns from "./notification.service";
import * as validators from "./notification.validation";

const router = Router({ caseSensitive: true, strict: true });

// -------------------------------------------------- ADD NOTIFICATION (ADMIN) --------------------------------------------------- //
router.post(
  "/",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.addNotification),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await ns.addNotification({
        admin: req.user,
        body: req.validate.body,
      });
      return { message: "success.notificationSent" };
    },
  ),
);
// -------------------------------------------------- GET ALL NOTIFICATIONS (ADMIN) --------------------------------------------------- //
router.get(
  "/",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.getAllNotifications),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const notifications = await ns.getNotificationsAdmin({
        query: req.validate.query,
      });
      return { message: "success.notificationsRetrieved", data: notifications };
    },
  ),
);
// -------------------------------------------------- MY NOTIFICATIONS (USER) --------------------------------------------------- //
router.get(
  "/me",
  middleware.authentication(),
  middleware.validation(validators.getAllNotifications),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const notifications = await ns.getNotificationsUser({
        query: req.validate.query,
        user: req.user,
      });
      return { message: "success.notificationsRetrieved", data: notifications };
    },
  ),
);
// -------------------------------------------------- SEEN ALL NOTIFICATIONS (USER) --------------------------------------------------- //
router.patch(
  "/seen-all",
  middleware.authentication(),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await ns.SeenAllNotificationsForUser({ user: req.user });
      return { message: "success.allNotificationsSeen" };
    },
  ),
);
// -------------------------------------------------- SEEN ONE NOTIFICATION (USER) --------------------------------------------------- //
router.patch(
  "/:notificationId/seen",
  middleware.authentication(),
  middleware.validation(validators.seenOneNotification),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await ns.SeenOneNotificationForUser({
        user: req.user,
        params: req.validate.params,
      });
      return { message: "success.notificationSeen" };
    },
  ),
);
// ----------------------------------------------- NOTIFICATION RECIPIENTS (ADMIN) ------------------------------------------------- //
router.get(
  "/:notificationId/recipients",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.notificationRecipients),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      const recipients = await ns.notificationRecipients({
        params: req.validate.params,
        query: req.validate.query,
      });
      return { message: "success.recipientsRetrieved", data: recipients };
    },
  ),
);
// -------------------------------------------------- DELETE NOTIFICATION (ADMIN) --------------------------------------------------- //
router.delete(
  "/:notificationId",
  middleware.authentication(),
  middleware.authorization({ accessRole: enums.RoleEnum.ADMIN }),
  middleware.validation(validators.deleteNotification),
  middleware.responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<itf.IResponse> => {
      await ns.DeleteNotification({ params: req.validate.params });
      return { message: "success.notificationDeleted" };
    },
  ),
);

export default router;
