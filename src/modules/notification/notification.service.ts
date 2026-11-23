import { enums, events, exceptions, objectId, type itf } from "../../common";
import { queries, type models } from "../../DB";
import type * as dto from "./dto/notification.dto";

class NotificationService {
  private readonly _userRepository: queries.UserRepository;
  private readonly _notificationRepository: queries.NotificationRepository;
  private readonly _notificationRecipientRepository: queries.NotificationRecipientRepository;

  constructor() {
    this._userRepository = new queries.UserRepository();
    this._notificationRepository = new queries.NotificationRepository();
    this._notificationRecipientRepository =
      new queries.NotificationRecipientRepository();
  }

  async addNotification({
    admin,
    body,
  }: {
    admin: models.HUser;
    body: dto.AddNotificationDto["body"];
  }) {
    const notification = await this._notificationRepository.createOne({
      data: { ...body, createdBy: admin._id },
    });

    const users = await this._userRepository.find({
      filter: {
        role: { $ne: enums.RoleEnum.ADMIN },
        confirmEmail: { $exists: true },
      },
      projection: "_id preferredLanguage",
      options: { lean: true },
    });

    const recipients = users.map((user) => {
      return {
        notification: notification._id,
        user: user._id,
      };
    });

    await this._notificationRecipientRepository.insertMany({
      data: recipients,
    });

    const payload: itf.INotificationEventPayload = {
      recipients: users,
      notificationData: body,
    };
    events.notificationEvent.emit(enums.EventsEnum.SEND_NOTIFICATION, payload);
  }

  async getNotificationsAdmin({
    query,
  }: {
    query: dto.GetAllNotificationsDto["query"];
  }) {
    const { page, limit } = query;
    const notifications = await this._notificationRepository.paginate({
      options: {
        sort: { createdAt: -1 },
      },

      page,
      limit,
    });

    return {
      ...notifications,
      docs: await Promise.all(
        (notifications.docs as models.HNotification[]).map(async (doc) => {
          const [totalCount, seenCount] = await Promise.all([
            this._notificationRecipientRepository.countDocuments({
              filter: { notification: doc._id },
            }),
            this._notificationRecipientRepository.countDocuments({
              filter: { notification: doc._id, seenAt: { $exists: true } },
            }),
          ]);
          return {
            ...doc.toJSON(),
            totalCount,
            seenCount,
            unseenCount: totalCount - seenCount,
          };
        }),
      ),
    };
  }

  async notificationRecipients({
    params,
    query,
  }: {
    params: dto.NotificationRecipientsDto["params"];
    query: dto.NotificationRecipientsDto["query"];
  }) {
    const { page, limit, seen } = query;
    const id = objectId.toObjectId({ id: params.notificationId });

    const notification = await this._notificationRepository.findById({
      id,
      projection: "_id",
    });

    if (!notification) {
      throw new exceptions.NotFoundException("error.notificationNotFound");
    }

    const data = await this._notificationRecipientRepository.paginate({
      filter: {
        notification: id,
        ...(seen && { seenAt: { $exists: seen == "true" } }),
      },
      options: {
        sort: { seenAt: -1, createdAt: -1 },
        populate: { path: "user", select: "firstName lastName image" },
      },
      page,
      limit,
    });

    return {
      ...data,
      docs: (data.docs as models.HNotificationRecipient[])
        .map((doc) => doc.toJSON())
        .filter((doc) => doc.user),
    };
  }

  async DeleteNotification({
    params,
  }: {
    params: dto.DeleteNotificationDto["params"];
  }) {
    const { notificationId } = params;

    const notification = await this._notificationRepository.findByIdAndDelete({
      id: objectId.toObjectId({ id: notificationId }),
    });

    if (!notification) {
      throw new exceptions.NotFoundException("error.notificationNotFound");
    }

    await this._notificationRecipientRepository.deleteMany({
      filter: {
        notification: objectId.toObjectId({ id: notificationId }),
      },
    });
  }

  async getNotificationsUser({
    query,
    user,
  }: {
    query: dto.GetAllNotificationsDto["query"];
    user: models.HUser;
  }) {
    const { page, limit } = query;

    const notifications = await this._notificationRecipientRepository.paginate({
      filter: {
        user: user._id,
      },
      options: {
        sort: { createdAt: -1 },
        populate: { path: "notification", select: "title body" },
      },
      page,
      limit,
    });

    return {
      ...notifications,
      docs: (notifications.docs as models.HNotificationRecipient[]).map((doc) =>
        doc.toJSON(),
      ),
    };
  }

  async SeenOneNotificationForUser({
    user,
    params,
  }: {
    user: models.HUser;
    params: dto.SeenOneNotificationDto["params"];
  }) {
    const { notificationId } = params;
    const recipient =
      await this._notificationRecipientRepository.findOneAndUpdate({
        filter: {
          notification: objectId.toObjectId({ id: notificationId }),
          user: user._id,
          seenAt: { $exists: false },
        },
        update: {
          seenAt: new Date(),
        },
      });

    if (!recipient) {
      // either already seen (fine) or not his notification (404)
      const exists = await this._notificationRecipientRepository.findOne({
        filter: {
          notification: objectId.toObjectId({ id: notificationId }),
          user: user._id,
        },
        projection: "_id",
      });
      if (!exists)
        throw new exceptions.NotFoundException("error.notificationNotFound");
    }
  }

  async SeenAllNotificationsForUser({ user }: { user: models.HUser }) {
    await this._notificationRecipientRepository.updateMany({
      filter: {
        user: user._id,
        seenAt: { $exists: false },
      },
      update: {
        seenAt: new Date(),
      },
    });
  }
}

export default new NotificationService();
