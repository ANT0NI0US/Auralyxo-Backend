import type { enums, tps } from "../../common";

export interface INotification {
  title: {
    ar: string;
    en: string;
  };
  body: {
    ar: string;
    en: string;
  };
  createdBy: tps.IdType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationEventPayload {
  recipients: { _id: tps.IdType; preferredLanguage?: enums.LanguageEnum }[];
  notificationData: Pick<INotification, "title" | "body">;
}
