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
  private followRepository: queries.FollowRepository;
  private cacheService: services.CacheService;
  private tokenService: services.TokenService;

  constructor() {
    this.userRepository = new queries.UserRepository();
    this.followRepository = new queries.FollowRepository();
    this.cacheService = services.cacheService;
    this.tokenService = services.tokenService;
  }

  private async followList({
    viewer,
    userId,
    page,
    limit,
    matchField,
    showField,
  }: {
    viewer: models.HUser;
    userId: string;
    page: number;
    limit: number;
    matchField: "follower" | "following";
    showField: "follower" | "following";
  }) {
    const targetUser = await this.userRepository.findOne({
      filter: { _id: objectId.toObjectId({ id: userId }) },
      projection: "visibility",
    });

    if (!targetUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    if (
      targetUser.visibility == enums.AccountVisibilityEnum.PRIVATE &&
      !viewer._id.equals(targetUser._id)
    ) {
      const isFollower = await this.followRepository.findOne({
        filter: {
          follower: viewer._id,
          following: targetUser._id,
          status: enums.FollowStatusEnum.ACCEPTED,
        },
        projection: "_id",
      });

      if (!isFollower) {
        throw new exceptions.ForbiddenException("error.privateAccount");
      }
    }

    const data = await this.followRepository.paginate({
      filter: {
        [matchField]: targetUser._id,
        status: enums.FollowStatusEnum.ACCEPTED,
      },
      options: {
        sort: { createdAt: -1 },
        populate: { path: showField, select: "firstName lastName image" },
      },
      page,
      limit,
    });

    return {
      ...data,
      docs: (data.docs as models.HFollow[])
        .map((doc) => doc.toJSON())
        .filter((doc) => doc[showField]),
    };
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

  async getUser({ params }: { params: dto.GetUserDto["params"] }) {
    const { userId } = params;

    const user = await this.userRepository.findOne({
      filter: {
        _id: objectId.toObjectId({ id: userId }),
        role: { $ne: enums.RoleEnum.ADMIN },
        paranoid: false,
      },
      projection: "-password -phone",
    });

    if (!user) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    return user.toJSON();
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
      projection: "firstName lastName image coverImages gender visibility",
    });

    if (!user) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    if (user.visibility == enums.AccountVisibilityEnum.PRIVATE) {
      const { firstName, lastName, image, visibility } = user.toJSON();
      return { _id: user._id, firstName, lastName, image, visibility };
    }
    return user.toJSON();
  }

  async deleteProfileImage({ user }: { user: models.HUser }) {
    const profileImageUrl = user.image;

    // after: removes the field from the document (same as a user who never uploaded)
    user.set("image", undefined);
    await user.save({ validateModifiedOnly: true });

    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: user._id }),
    });

    if (profileImageUrl) {
      await fileUpload.deleteLocalFile({ url: profileImageUrl });
    }
    return;
  }

  async coverImages({
    user,
    files,
  }: {
    user: models.HUser;
    files: dto.CoverImagesDto["files"];
  }) {
    const oldCoverImages = user.coverImages;

    user.coverImages = files.map((ele) => ele.path);
    await user.save({ validateModifiedOnly: true });
    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: user._id }),
    });

    if (oldCoverImages?.length) {
      await Promise.all(
        oldCoverImages
          .filter((url) => Boolean(url))
          .map((url) => fileUpload.deleteLocalFile({ url })),
      );
    }

    return user.coverImages;
  }

  async profileImage({
    user,
    file,
  }: {
    user: models.HUser;
    file: dto.ProfileImageDto["file"];
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
      projection: "role status email image coverImages",
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

    // remove every follow where he is the follower or the one being followed (+ pending requests)
    await this.followRepository.deleteMany({
      filter: {
        $or: [{ follower: targetUser._id }, { following: targetUser._id }],
      },
    });

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
      [targetUser.image, ...(targetUser.coverImages ?? [])]
        .filter((url): url is string => Boolean(url))
        .map((url) => fileUpload.deleteLocalFile({ url })),
    );

    return;
  }

  async updateVisibility({
    user,
    body,
  }: {
    user: models.HUser;
    body: dto.ToggleVisibilityDto["body"];
  }) {
    const { visibility } = body;

    if (user.visibility == visibility) {
      throw new exceptions.ConflictException("error.visibilityAlreadySet");
    }

    await this.userRepository.findByIdAndUpdate({
      id: user._id,
      update: { visibility },
    });

    if (visibility == enums.AccountVisibilityEnum.PUBLIC) {
      await this.followRepository.updateMany({
        filter: {
          following: user._id,
          status: enums.FollowStatusEnum.PENDING,
        },
        update: {
          status: enums.FollowStatusEnum.ACCEPTED,
        },
      });
    }

    await this.cacheService.del({
      key: this.tokenService.userBaseProfile({ userId: user._id }),
    });

    return visibility;
  }

  async followAccount({
    params,
    user,
  }: {
    params: dto.FollowAccountDto["params"];
    user: models.HUser;
  }) {
    const { userId } = params;

    if (user._id.equals(userId)) {
      throw new exceptions.BadRequestException("error.cannotFollowYourself");
    }

    const targetUser = await this.userRepository.findOne({
      filter: { _id: objectId.toObjectId({ id: userId }) },
      projection: "visibility",
    });

    if (!targetUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    const existingFollow = await this.followRepository.findOne({
      filter: { follower: user._id, following: targetUser._id },
      projection: "_id",
    });

    if (existingFollow) {
      throw new exceptions.ConflictException("error.alreadyFollowing");
    }

    const newFollow = await this.followRepository.create({
      data: {
        follower: user._id,
        following: targetUser._id,
        status:
          targetUser.visibility == enums.AccountVisibilityEnum.PRIVATE
            ? enums.FollowStatusEnum.PENDING
            : enums.FollowStatusEnum.ACCEPTED,
      },
    });

    return newFollow.toJSON();
  }

  async unFollowAccount({
    params,
    user,
  }: {
    params: dto.UnFollowAccountDto["params"];
    user: models.HUser;
  }) {
    const { userId } = params;

    if (user._id.equals(userId)) {
      throw new exceptions.BadRequestException("error.cannotUnfollowYourself");
    }

    const deletedFollow = await this.followRepository.findOneAndDelete({
      filter: {
        follower: user._id,
        following: objectId.toObjectId({ id: userId }),
      },
    });

    if (!deletedFollow) {
      throw new exceptions.NotFoundException("error.notFollowing");
    }

    return;
  }

  async followers({
    query,
    params,
    user,
  }: {
    query: dto.GetFollowersDto["query"];
    params: dto.GetFollowersDto["params"];
    user: models.HUser;
  }) {
    const { page, limit } = query;
    const { userId } = params;

    return this.followList({
      viewer: user,
      userId,
      page,
      limit,
      matchField: "following",
      showField: "follower",
    });
  }

  async following({
    query,
    params,
    user,
  }: {
    query: dto.GetFollowingsDto["query"];
    params: dto.GetFollowingsDto["params"];
    user: models.HUser;
  }) {
    const { page, limit } = query;
    const { userId } = params;

    return this.followList({
      viewer: user,
      userId,
      page,
      limit,
      matchField: "follower",
      showField: "following",
    });
  }

  async followRequests({
    query,
    user,
  }: {
    query: dto.GetFollowRequestsDto["query"];
    user: models.HUser;
  }) {
    const { page, limit } = query;

    if (user.visibility == enums.AccountVisibilityEnum.PUBLIC) {
      throw new exceptions.BadRequestException("error.accountIsPublic");
    }

    const data = await this.followRepository.paginate({
      filter: {
        following: user._id,
        status: enums.FollowStatusEnum.PENDING,
      },
      options: {
        sort: { createdAt: -1 },
        populate: { path: "follower", select: "firstName lastName image" },
      },
      page,
      limit,
    });

    return {
      ...data,
      docs: (data.docs as models.HFollow[])
        .map((doc) => doc.toJSON())
        .filter((doc) => doc["follower"]),
    };
  }

  async actionToRequest({
    params,
    body,
    user,
  }: {
    params: dto.TakeAnActionToRequestDto["params"];
    body: dto.TakeAnActionToRequestDto["body"];
    user: models.HUser;
  }) {
    const { userId } = params;
    const { action } = body;

    if (user._id.equals(userId)) {
      throw new exceptions.NotFoundException("error.followRequestNotFound");
    }

    switch (action) {
      case enums.FollowRequestActionEnum.ACCEPTED: {
        const updateRequest = await this.followRepository.findOneAndUpdate({
          filter: {
            follower: userId,
            following: user._id,
            status: enums.FollowStatusEnum.PENDING,
          },
          update: {
            status: enums.FollowStatusEnum.ACCEPTED,
          },
        });

        if (!updateRequest) {
          throw new exceptions.NotFoundException("error.followRequestNotFound");
        }

        return "success.followRequestAccepted";
      }
      case enums.FollowRequestActionEnum.REJECTED: {
        const deleteRequest = await this.followRepository.findOneAndDelete({
          filter: {
            follower: userId,
            following: user._id,
            status: enums.FollowStatusEnum.PENDING,
          },
        });

        if (!deleteRequest) {
          throw new exceptions.NotFoundException("error.followRequestNotFound");
        }

        return "success.followRequestRejected";
      }

      default:
        throw new exceptions.BadRequestException(
          "validation.followRequestAction.invalid",
        );
    }
  }

  async searchUsers({
    query,
    user,
  }: {
    query: dto.SearchUsersDto["query"];
    user: models.HUser;
  }) {
    const { search, page, limit } = query;

    const text = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const data = await this.userRepository.paginate({
      filter: {
        _id: { $ne: user._id },
        role: { $ne: enums.RoleEnum.ADMIN },
        confirmEmail: { $exists: true },
        $or: [
          { firstName: { $regex: text, $options: "i" } },
          { lastName: { $regex: text, $options: "i" } },
        ],
      },
      projection: "firstName lastName image visibility",
      options: { sort: { createdAt: -1 } },
      page,
      limit,
    });

    return {
      ...data,
      docs: (data.docs as models.HUser[]).map((doc) => doc.toJSON()),
    };
  }

  async suggestions({
    query,
    user,
  }: {
    query: dto.GetSuggestionsDto["query"];
    user: models.HUser;
  }) {
    const { limit } = query;

    const users = await this.userRepository.find({
      filter: {
        _id: { $ne: user._id },
        confirmEmail: { $exists: true },
        role: { $ne: enums.RoleEnum.ADMIN },
      },
      projection: "firstName lastName image visibility",
      options: { sort: { createdAt: -1 }, limit },
    });

    return users.map((doc) => doc.toJSON());
  }

  async removeExistingFollower({
    params,
    user,
  }: {
    params: dto.RemoveExistingFollowerDto["params"];
    user: models.HUser;
  }) {
    const { userId } = params;

    if (user._id.equals(userId)) {
      throw new exceptions.BadRequestException("error.cannotRemoveYourself");
    }

    const deletedFollow = await this.followRepository.findOneAndDelete({
      filter: {
        follower: objectId.toObjectId({ id: userId }),
        following: user._id,
        status: enums.FollowStatusEnum.ACCEPTED,
      },
    });

    if (!deletedFollow) {
      throw new exceptions.NotFoundException("error.notYourFollower");
    }

    return;
  }
}

export default new UserService();
