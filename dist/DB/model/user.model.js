"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const common_1 = require("../../common");
const numericValues = (e) => Object.values(e).filter((v) => typeof v === "number");
const userSchema = new mongoose_1.default.Schema({
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
        required: [true, "validation.lastName.required"],
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
        required: [
            function () {
                return this.provider == common_1.enums.ProviderEnum.SYSTEM;
            },
            "validation.password.required",
        ],
    },
    phone: String,
    DOB: Date,
    confirmEmail: Date,
    image: String,
    coverImage: [String],
    gender: {
        type: Number,
        enum: {
            values: numericValues(common_1.enums.GenderEnum),
            message: "validation.gender.invalid",
        },
        default: common_1.enums.GenderEnum.MALE,
    },
    role: {
        type: Number,
        enum: {
            values: numericValues(common_1.enums.RoleEnum),
            message: "validation.role.invalid",
        },
        default: common_1.enums.RoleEnum.USER,
    },
    provider: {
        type: Number,
        enum: {
            values: numericValues(common_1.enums.ProviderEnum),
            message: "validation.provider.invalid",
        },
        default: common_1.enums.ProviderEnum.SYSTEM,
    },
    changeCredentialsTime: Date,
    twoStepVerification: Boolean,
    status: {
        type: Number,
        enum: {
            values: numericValues(common_1.enums.AccountStatusEnum),
            message: "validation.status.invalid",
        },
        default: common_1.enums.AccountStatusEnum.ACTIVE,
    },
    changeStatusAt: Date,
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    autoIndex: true,
    strictQuery: true,
    optimisticConcurrency: true,
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre("validate", function () {
    if (this.provider != common_1.enums.ProviderEnum.SYSTEM && this.password) {
        throw new common_1.exceptions.BadRequestException("error.googleAccountCannotHoldPassword");
    }
});
userSchema.pre("save", async function () {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await common_1.security.hash({ plainText: this.password });
    }
    if (this.isModified("phone")) {
        this.phone = await common_1.security.encrypt(this.phone);
    }
});
userSchema.pre(["find", "findOne", "countDocuments"], async function () {
    const query = this.getFilter();
    if (query.paranoid != false)
        this.setQuery({
            ...query,
            status: { $ne: common_1.enums.AccountStatusEnum.ARCHIVE },
        });
});
userSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], async function () {
    const query = this.getFilter();
    const update = this.getUpdate();
    if (update.status == common_1.enums.AccountStatusEnum.ACTIVE) {
        this.setQuery({
            ...query,
            status: { $eq: common_1.enums.AccountStatusEnum.ARCHIVE },
        });
    }
    else if (update.status == common_1.enums.AccountStatusEnum.ARCHIVE) {
        this.setQuery({
            ...query,
            status: { $eq: common_1.enums.AccountStatusEnum.ACTIVE },
        });
    }
    const hasStatus = update.status !== undefined;
    if (!hasStatus && query.paranoid != false)
        this.setQuery({
            ...query,
            status: { $ne: common_1.enums.AccountStatusEnum.ARCHIVE },
        });
    this.setUpdate({
        ...this.getUpdate(),
        ...(hasStatus ? { changeStatusAt: new Date() } : {}),
    });
});
userSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], async function () {
    const query = this.getFilter();
    if (!query.force)
        this.setQuery({
            ...query,
            status: { $eq: common_1.enums.AccountStatusEnum.ARCHIVE },
        });
});
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
