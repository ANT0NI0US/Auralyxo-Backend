import { Types } from "mongoose";
import {
  enums,
  exceptions,
  fileUpload,
  objectId,
  security,
  services,
} from "../../common";
import { models, queries } from "../../DB";
import * as dto from "./dto/user.dto";

class UserService {
  private userRepository: queries.UserRepository;
  private cacheService: services.CacheService;
  private tokenService: services.TokenService;

  constructor() {
    this.userRepository = new queries.UserRepository();
    this.cacheService = services.cacheService;
    this.tokenService = services.tokenService;
  }

  async profile({ user }: { user: models.HUser }) {
    if (user.phone) {
      user.phone = await security.decrypt(user.phone);
    }

    return user.toJSON();
  }

  async allUsers({ query }: { query: dto.GetAllUsersDto["query"] }) {
    const { page, limit, type } = query;
    let filter = {};
    switch (type) {
      case enums.UsersByAccountStatusEnum.ARCHIVE:
        filter = {
          paranoid: false,
          status: enums.AccountStatusEnum.ARCHIVE,
        };
        break;

      case enums.UsersByAccountStatusEnum.ACTIVE:
        filter = { status: enums.AccountStatusEnum.ACTIVE };
        break;

      default:
        filter = { paranoid: false };
        break;
    }

    const data = await this.userRepository.paginate({
      filter: {
        role: { $ne: enums.RoleEnum.ADMIN },
        ...filter,
      },
      options: {
        sort: { createdAt: -1 },
      },
      projection: "-password -phone",
      page,
      limit,
    });

    return {
      ...data,
      docs: (data.docs as models.HUser[]).map((doc) => doc.toJSON()),
    };
  }

  async updateUser({
    user,
    updatedData,
  }: {
    user: models.HUser;
    updatedData: dto.UpdateDto["body"];
  }) {
    if (updatedData.phone) {
      updatedData.phone = await security.encrypt(updatedData.phone);
    }
    const updatedUser = await this.userRepository.findByIdAndUpdate({
      id: user._id,
      update: updatedData,
    });
    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: user._id }),
    });

    if (updatedUser?.phone) {
      updatedUser.phone = await security.decrypt(updatedUser.phone);
    }
    return updatedUser?.toJSON();
  }

  async shareProfile({ params }: { params: dto.ShareProfileDto["params"] }) {
    const { userId } = params;
    const user = await this.userRepository.findById({
      id: new Types.ObjectId(userId),
      projection: "firstName lastName image coverImage gender",
    });

    if (!user) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    return user.toJSON();
  }

  async profileImage({
    user,
    file,
  }: {
    user: models.HUser;
    file: Express.Multer.File;
  }) {
    // keep the old image before overwriting it
    const oldImage = user.image;

    user.image = file.path;
    // we use validateModifiedOnly: true cause we remove password from back in all cases and we don't want to validate it.
    await user.save({ validateModifiedOnly: true });
    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: user._id }),
    });

    // remove the old image only after the new one is saved
    if (oldImage) {
      await fileUpload.deleteLocalFile({ url: oldImage });
    }

    return user.image;
  }

  async updateStatus({
    admin,
    params,
    body,
  }: {
    admin: models.HUser;
    params: dto.ToggleAccountStatusDto["params"];
    body: dto.ToggleAccountStatusDto["body"];
  }) {
    const { userId } = params;
    const { status } = body;

    // the admin can't archive himself, otherwise he locks himself out of the system
    if (admin._id.equals(userId)) {
      throw new exceptions.BadRequestException("error.cannotChangeOwnStatus");
    }

    // paranoid: false → find the user even if he is archived (to be able to activate him)
    const targetUser = await this.userRepository.findOne({
      filter: { _id: objectId.toObjectId({ id: userId }), paranoid: false },
      projection: "role status",
    });

    if (!targetUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    // an admin can't change the status of another admin
    if (targetUser.role == enums.RoleEnum.ADMIN) {
      throw new exceptions.ForbiddenException("error.forbidden");
    }

    if (targetUser.status == status) {
      throw new exceptions.ConflictException("error.statusAlreadySet");
    }

    // the update hook will:
    // - make the filter status = the opposite one (ACTIVE needs ARCHIVE and vice versa)
    // - set changeStatusAt = new Date()
    const updatedUser = await this.userRepository.findByIdAndUpdate({
      id: targetUser._id,
      update: {
        status,
        // when archiving: kill every token he already has, even after he gets activated again
        ...(status == enums.AccountStatusEnum.ARCHIVE
          ? { changeCredentialsTime: new Date() }
          : {}),
      },
    });

    // someone else changed the status between our findOne and the update
    if (!updatedUser) {
      throw new exceptions.ConflictException("error.statusAlreadySet");
    }

    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: updatedUser._id }),
    });

    return {
      userId: updatedUser._id,
      status: updatedUser.status,
      changeStatusAt: updatedUser.changeStatusAt,
    };
  }

  async deleteUser({
    admin,
    params,
  }: {
    admin: models.HUser;
    params: dto.DeleteUserDto["params"];
  }) {
    const { userId } = params;

    // the admin can't delete himself
    if (admin._id.equals(userId)) {
      throw new exceptions.BadRequestException("error.cannotDeleteOwnAccount");
    }

    // paranoid: false → we need to find him cause he must be archived before deleting
    const targetUser = await this.userRepository.findOne({
      filter: { _id: objectId.toObjectId({ id: userId }), paranoid: false },
      projection: "role status email image coverImage",
    });

    if (!targetUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    // an admin can't delete another admin
    if (targetUser.role == enums.RoleEnum.ADMIN) {
      throw new exceptions.ForbiddenException("error.forbidden");
    }

    // the user must be archived first, the delete hook only deletes archived users (without force)
    if (targetUser.status != enums.AccountStatusEnum.ARCHIVE) {
      throw new exceptions.ConflictException("error.archiveBeforeDelete");
    }

    // the delete hook adds status: ARCHIVE to the filter
    const deletedUser = await this.userRepository.findByIdAndDelete({
      id: targetUser._id,
    });

    // someone activated him between our findOne and the delete
    if (!deletedUser) {
      throw new exceptions.ConflictException("error.archiveBeforeDelete");
    }

    // remove every redis key related to this user (profile, revoke tokens, otp, login trials)
    const [userIdKeys, userEmailKeys] = await Promise.all([
      this.cacheService.keys({
        prefix: `User::${targetUser._id.toString()}::`,
      }),
      this.cacheService.keys({ prefix: `User::${targetUser.email}::` }),
    ]);

    // always has the profile key → the array is never empty (redis DEL fails with no keys)
    await this.cacheService.del({
      key: [
        ...new Set([
          ...userIdKeys,
          ...userEmailKeys,
          this.tokenService.userBaseProfile({ userId: targetUser._id }),
        ]),
      ],
    });

    // remove his uploaded images from assets
    await Promise.all(
      [targetUser.image, ...(targetUser.coverImage ?? [])]
        .filter((url): url is string => Boolean(url))
        .map((url) => fileUpload.deleteLocalFile({ url })),
    );

    return;
  }
}

export default new UserService();
