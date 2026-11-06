"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const DB_1 = require("../../DB");
class UserService {
    userRepository;
    cacheService;
    tokenService;
    constructor() {
        this.userRepository = new DB_1.queries.UserRepository();
        this.cacheService = common_1.services.cacheService;
        this.tokenService = common_1.services.tokenService;
    }
    async profile({ user }) {
        if (user.phone) {
            user.phone = await common_1.security.decrypt(user.phone);
        }
        return user.toJSON();
    }
    async allUsers({ user, query, }) {
        const { page, limit, type } = query;
        let filter = {};
        switch (type) {
            case common_1.enums.UsersByAccountStatusEnum.ARCHIVE:
                filter = {
                    paranoid: false,
                    status: common_1.enums.AccountStatusEnum.ARCHIVE,
                };
                break;
            case common_1.enums.UsersByAccountStatusEnum.ACTIVE:
                filter = { status: common_1.enums.AccountStatusEnum.ACTIVE };
                break;
            default:
                filter = { paranoid: false };
                break;
        }
        const data = await this.userRepository.paginate({
            filter: { _id: { $ne: user._id }, ...filter },
            options: {
                sort: { createdAt: -1 },
            },
            projection: "-password -phone",
            page,
            limit,
        });
        return {
            ...data,
            docs: data.docs.map((doc) => doc.toJSON()),
        };
    }
    async updateUser({ user, updatedData, }) {
        if (updatedData.phone) {
            updatedData.phone = await common_1.security.encrypt(updatedData.phone);
        }
        const updatedUser = await this.userRepository.findByIdAndUpdate({
            id: user._id,
            update: updatedData,
            options: { projection: "-password" },
        });
        await this.cacheService.del({
            key: this.tokenService.userBaseProfile({ userId: user._id }),
        });
        if (updatedUser?.phone) {
            updatedUser.phone = await common_1.security.decrypt(updatedUser.phone);
        }
        return updatedUser?.toJSON();
    }
    async shareProfile({ params }) {
        const { userId } = params;
        const user = await this.userRepository.findById({
            id: new mongoose_1.Types.ObjectId(userId),
            projection: "-password",
        });
        if (!user) {
            throw new common_1.exceptions.NotFoundException("error.invalidUser");
        }
        if (user.phone) {
            user.phone = await common_1.security.decrypt(user.phone);
        }
        return user.toJSON();
    }
    async profileImage({ user, file, }) {
        if (file) {
            user.image = file.path;
            await user.save({ validateModifiedOnly: true });
            await this.cacheService.del({
                key: this.tokenService.userBaseProfile({ userId: user._id }),
            });
        }
        return user.image;
    }
}
exports.default = new UserService();
