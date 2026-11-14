import mongoose, { HydratedDocument } from "mongoose";
import { enums, events, exceptions, itf, security } from "../../common";
import configService from "../../config.service";
import { numericValues } from "./numericValues";

const userSchema = new mongoose.Schema<itf.IUser>(
  {
    firstName: {
      type: String,
      minLength: [2, "validation.firstName.min"],
      maxLength: [30, "validation.firstName.max"],
      required: [true, "validation.firstName.required"],
    },
    lastName: {
      type: String,
      minLength: [2, "validation.lastName.min"],
      maxLength: [30, "validation.lastName.max"],
      required: [
        function (): boolean {
          return this.provider == enums.ProviderEnum.SYSTEM;
        },
        "validation.lastName.required",
      ],
    },
    email: {
      type: String,
      required: [true, "validation.email.required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: [
        function (): boolean {
          return this.provider == enums.ProviderEnum.SYSTEM;
        },
        "validation.password.required",
      ],
    },
    phone: String,
    DOB: Date,
    confirmEmail: Date,
    image: String,
    coverImages: [String],
    gender: {
      type: Number,
      enum: {
        values: numericValues(enums.GenderEnum),
        message: "validation.gender.invalid",
      },
      default: enums.GenderEnum.MALE,
    },
    role: {
      type: Number,
      enum: {
        values: numericValues(enums.RoleEnum),
        message: "validation.role.invalid",
      },
      default: enums.RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: {
        values: numericValues(enums.ProviderEnum),
        message: "validation.provider.invalid",
      },
      default: enums.ProviderEnum.SYSTEM,
    },
    changeCredentialsTime: Date,
    twoStepVerification: { type: Boolean, default: false },
    status: {
      type: Number,
      enum: {
        values: numericValues(enums.AccountStatusEnum),
        message: "validation.status.invalid",
      },
      default: enums.AccountStatusEnum.ACTIVE,
    },
    changeStatusAt: Date,
    visibility: {
      type: Number,
      enum: {
        values: numericValues(enums.AccountVisibilityEnum),
        message: "validation.visibility.invalid",
      },
      default: enums.AccountVisibilityEnum.PUBLIC,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    strict: true,
    autoIndex: true,
    strictQuery: true,
    optimisticConcurrency: true,
  },
);

userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, ...rest] = value.trim().split(/\s+/);
    this.set({ firstName, lastName: rest.join(" ") });
  })
  .get(function () {
    return [this.firstName, this.lastName].filter(Boolean).join(" ");
  });

// make sure that there is no password when the provider is not a ProviderEnum.SYSTEM
userSchema.pre("validate", function () {
  if (this.provider != enums.ProviderEnum.SYSTEM && this.password) {
    throw new exceptions.BadRequestException(
      "error.googleAccountCannotHoldPassword",
    );
  }
});

// hash and encrypt the password and phone before saving the user document
userSchema.pre("save", async function (this: HUser & { wasNew: boolean }) {
  this.wasNew = this.isNew;
  if (this.isModified("password")) {
    this.password = await security.hash({ plainText: this.password as string });
  }
  if (this.isModified("phone")) {
    this.phone = await security.encrypt(this.phone as string);
  }
});

userSchema.post("save", function (doc) {
  if ((this as HUser & { wasNew: boolean }).wasNew) {
    events.emailEvent.emit(enums.EventsEnum.SEND_EMAIL, {
      recipient: { to: configService.APP_EMAIL },
      subject: enums.EmailSubjectEnum.NEW_USER_REGISTERED,
      data: {
        lang: enums.LanguageEnum.EN,
        user: {
          username: this.username,
          email: this.email,
          provider: this.provider,
          createdAt: this.createdAt,
        },
      },
    });
  }
});

// return in ["find", "findOne", "countDocuments"] only the users that are not archived unless the query has a property called "paranoid" with a value of false
userSchema.pre(["find", "findOne", "countDocuments"], async function () {
  const query = this.getFilter();

  if (query.paranoid != false)
    this.setQuery({
      ...query,
      status: { $ne: enums.AccountStatusEnum.ARCHIVE },
    });
});

// change the status + allow update in Active documents only + change the changeStatusAt when i change in the status
userSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate"],
  async function () {
    const query = this.getFilter();
    const rawUpdate = this.getUpdate();

    // pipeline update is an array, spreading it below would break it, so only hide the archived users
    if (Array.isArray(rawUpdate)) {
      if (query.paranoid != false)
        this.setQuery({
          ...query,
          status: { $ne: enums.AccountStatusEnum.ARCHIVE },
        });
      return;
    }

    const update = rawUpdate as HUser;

    if (update.status == enums.AccountStatusEnum.ACTIVE) {
      this.setQuery({
        ...query,
        status: { $eq: enums.AccountStatusEnum.ARCHIVE },
      });
    } else if (update.status == enums.AccountStatusEnum.ARCHIVE) {
      this.setQuery({
        ...query,
        status: { $eq: enums.AccountStatusEnum.ACTIVE },
      });
    }

    const hasStatus = update.status !== undefined;

    if (!hasStatus && query.paranoid != false)
      this.setQuery({
        ...query,
        status: { $ne: enums.AccountStatusEnum.ARCHIVE },
      });

    this.setUpdate({
      ...this.getUpdate(),
      ...(hasStatus ? { changeStatusAt: new Date() } : {}),
    });
  },
);

// hard delete when i have an archive document or when i have force:true
userSchema.pre(
  ["deleteOne", "deleteMany", "findOneAndDelete"],
  async function () {
    const query = this.getFilter();

    if (!query.force)
      this.setQuery({
        ...query,
        status: { $eq: enums.AccountStatusEnum.ARCHIVE },
      });
  },
);

export const UserModel =
  mongoose.models.User || mongoose.model<itf.IUser>("User", userSchema);

export type HUser = HydratedDocument<itf.IUser>;
