import { Types } from "mongoose";
import {
  enums,
  exceptions,
  // fileUpload,
  objectId,
  security,
  services,
  type tps,
} from "../../common";
import { type models, queries } from "../../DB";
import type * as dto from "./dto/user.dto";
import type * as entities from "./entities/user.entities";

class UserService {
  private readonly _userRepository: queries.UserRepository;
  private readonly _friendRequestRepository: queries.FriendRequestRepository;
  private readonly _notificationRecipientRepository: queries.NotificationRecipientRepository;
  private readonly _cacheService: services.CacheService;
  private readonly _tokenService: services.TokenService;
  private readonly _cloudService: services.CloudService;
  private readonly _notificationService: services.NotificationService;

  constructor() {
    this._userRepository = new queries.UserRepository();
    this._friendRequestRepository = new queries.FriendRequestRepository();
    this._notificationRecipientRepository =
      new queries.NotificationRecipientRepository();
    this._cacheService = services.cacheService;
    this._tokenService = services.tokenService;
    this._cloudService = services.cloudService;
    this._notificationService = services.notificationService;
  }

  // a friendship is one request between the two users, whoever sent it → always search in both directions
  private betweenUsers(firstId: tps.IdType, secondId: tps.IdType) {
    return {
      $or: [
        { senderId: firstId, receiverId: secondId },
        { senderId: secondId, receiverId: firstId },
      ],
    };
  }

  // keep the stored friends array of both sides in sync with the friend requests, then drop their cached profiles
  // paranoid: false → archived users are updated too, so no one keeps a stale id
  private async syncFriends({
    action,
    userId,
    friendIds,
  }: {
    action: "add" | "remove";
    userId: tps.IdType;
    friendIds: tps.IdType[];
  }) {
    if (!friendIds.length) return;

    await Promise.all([
      this._userRepository.updateOne({
        filter: { _id: userId, paranoid: false },
        update:
          action == "add"
            ? { $addToSet: { friends: { $each: friendIds } } }
            : { $pull: { friends: { $in: friendIds } } },
      }),
      this._userRepository.updateMany({
        filter: { _id: { $in: friendIds }, paranoid: false },
        update:
          action == "add"
            ? { $addToSet: { friends: userId } }
            : { $pull: { friends: userId } },
      }),
    ]);

    await this._cacheService.del({
      key: [userId, ...friendIds].map((id) =>
        this._tokenService.userBaseProfile({ userId: id }),
      ),
    });
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

    const data = await this._userRepository.paginate({
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

    const user = await this._userRepository.findOne({
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
    const updatedUser = await this._userRepository.findByIdAndUpdate({
      id: user._id,
      update: updatedData,
    });

    await this._cacheService.del({
      key: this._tokenService.userBaseProfile({ userId: user._id }),
    });

    if (updatedUser?.phone) {
      updatedUser.phone = await security.decrypt(updatedUser.phone);
    }

    return updatedUser?.toJSON();
  }

  async updatePreferredLanguage({
    user,
    body,
  }: {
    user: models.HUser;
    body: dto.UpdatePreferredLanguageDto["body"];
  }) {
    const { preferredLanguage } = body;

    if (user.preferredLanguage == preferredLanguage) {
      throw new exceptions.ConflictException("error.languageAlreadySet");
    }

    await this._userRepository.findByIdAndUpdate({
      id: user._id,
      update: { preferredLanguage },
    });

    await this._cacheService.del({
      key: this._tokenService.userBaseProfile({ userId: user._id }),
    });

    return preferredLanguage;
  }

  async shareProfile({
    user,
    params,
  }: {
    user: models.HUser;
    params: dto.ShareProfileDto["params"];
  }) {
    const { userId } = params;

    const existingUser = await this._userRepository.findById({
      id: objectId.toObjectId({ id: userId }),
      projection: "firstName lastName image coverImages gender visibility",
    });

    if (!existingUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    const isOwner = user._id.equals(userId);
    const isFriend = (user.friends as Types.ObjectId[]).some((friendId) =>
      friendId.equals(userId),
    );

    if (
      existingUser.visibility == enums.AccountVisibilityEnum.PRIVATE &&
      !isOwner &&
      !isFriend
    ) {
      const { firstName, lastName, image, visibility } = existingUser.toJSON();
      return {
        _id: existingUser._id,
        firstName,
        lastName,
        image,
        visibility,
      };
    }

    return existingUser.toJSON();
  }

  // * using s3 bucket
  async deleteProfileImage({ user }: { user: models.HUser }) {
    const profileImageUrl = user.image;

    await this._userRepository.findByIdAndUpdate({
      id: user._id,
      update: {
        $unset: { image: 1 },
      },
    });

    await this._cacheService.del({
      key: this._tokenService.userBaseProfile({ userId: user._id }),
    });

    if (profileImageUrl) {
      await this._cloudService.deleteAsset({ Key: profileImageUrl });
    }

    return;
  }

  // * using s3 bucket
  async coverImages({
    user,
    files,
  }: {
    user: models.HUser;
    files: dto.CoverImagesDto["files"];
  }) {
    // const oldCoverImages = user.coverImages;

    // const newCoverImages = await this._cloudService.uploadAssets({
    //   files: files as tps.FileType[],
    //   path: `User/${user._id.toString()}/cover-images`,
    // });

    // await this._userRepository.findByIdAndUpdate({
    //   id: user._id,
    //   update: {
    //     coverImages: newCoverImages,
    //   },
    // });

    // await this._cacheService.del({
    //   key: this._tokenService.userBaseProfile({ userId: user._id }),
    // });

    // if (oldCoverImages?.length) {
    //   await this._cloudService.deleteAssets({ Keys: oldCoverImages });
    // }

    // return newCoverImages;

    return await this._cloudService.replaceAssets({
      files: files as tps.FileType[],
      path: `User/${user._id.toString()}/cover-images`,
      oldKeys: user.coverImages,
      onUploaded: async (newKeys) => {
        await this._userRepository.findByIdAndUpdate({
          id: user._id,
          update: { coverImages: newKeys },
        });

        await this._cacheService.del({
          key: this._tokenService.userBaseProfile({ userId: user._id }),
        });
      },
    });
  }

  // * using s3 bucket
  async profileImage({
    user,
    file,
  }: {
    user: models.HUser;
    file: dto.ProfileImageDto["file"];
  }) {
    // keep the old image before overwriting it
    // const oldImage = user.image;

    /*
    * using uploadAsset
    const newImage = await this._cloudService.uploadAsset({
      file: file as tps.FileType,
      path: `User/${user._id.toString()}/profile`,
    });

    await this._userRepository.findByIdAndUpdate({
      id: user._id,
      update: {
        image: newImage,
      },
    });
    */

    // using uploadLargeAsset
    // const newImage = await this._cloudService.uploadLargeAsset({
    //   // storageApproach: enums.StorageApproachEnum.MEMORY,
    //   file: file as tps.FileType,
    //   path: `User/${user._id.toString()}/profile`,
    // });

    // await this._userRepository.findByIdAndUpdate({
    //   id: user._id,
    //   update: {
    //     image: newImage.Key as string,
    //   },
    // });

    // await this._cacheService.del({
    //   key: this._tokenService.userBaseProfile({ userId: user._id }),
    // });

    // remove the old image only after the new one is saved
    // if (oldImage) {
    //   await this._cloudService.deleteAsset({ Key: oldImage });
    // }

    // return newImage.Key as string;

    return await this._cloudService.replaceAsset({
      file: file as tps.FileType,
      path: `User/${user._id.toString()}/profile`,
      oldKey: user.image,
      onUploaded: async (newKey) => {
        await this._userRepository.findByIdAndUpdate({
          id: user._id,
          update: { image: newKey },
        });

        await this._cacheService.del({
          key: this._tokenService.userBaseProfile({ userId: user._id }),
        });
      },
    });
  }

  // * using s3 bucket pre assigned
  async profileImagePreAssigned({
    user,
    body,
  }: {
    user: models.HUser;
    body: dto.ProfileImagePreAssignedDto["body"];
  }): Promise<entities.IProfileImagePreAssignedResponse> {
    // keep the old image before overwriting it
    const oldImage = user.image;
    /*
    * LIKE
    ContentType : image/jpeg
    Originalname : antonious.jpg
    */
    const { ContentType, Originalname } = body;
    const { url } = await this._cloudService.createUploadPreSignedAssetLink({
      ContentType,
      Originalname,
      path: `User/${user._id.toString()}/profile`,
    });

    await this._cacheService.del({
      key: this._tokenService.userBaseProfile({ userId: user._id }),
    });

    // remove the old image only after the new one is saved
    if (oldImage) {
      await this._cloudService.deleteAsset({ Key: oldImage });
    }

    return { url };
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
    const targetUser = await this._userRepository.findOne({
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
    const updatedUser = await this._userRepository.findByIdAndUpdate({
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

    await this._cacheService.del({
      key: this._tokenService.userBaseProfile({ userId: updatedUser._id }),
    });

    // archived → his devices must stop receiving notifications (he logs in again after activation)
    if (status == enums.AccountStatusEnum.ARCHIVE) {
      await this._notificationService.removeFCMUser({
        userId: updatedUser._id,
      });
    }

    return {
      userId: updatedUser._id,
      status: updatedUser.status,
      changeStatusAt: updatedUser.changeStatusAt,
    };
  }

  // * using s3 bucket
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
    const targetUser = await this._userRepository.findOne({
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
    const deletedUser = await this._userRepository.findByIdAndDelete({
      id: targetUser._id,
    });

    // someone activated him between our findOne and the delete
    if (!deletedUser) {
      throw new exceptions.ConflictException("error.archiveBeforeDelete");
    }

    // remove his id from the friends array of every friend he had
    const friendships = await this._friendRequestRepository.find({
      filter: {
        $or: [{ senderId: targetUser._id }, { receiverId: targetUser._id }],
        status: enums.FriendRequestStatusEnum.ACCEPTED,
      },
      projection: "senderId receiverId",
    });

    await this.syncFriends({
      action: "remove",
      userId: targetUser._id,
      friendIds: friendships.map((request) =>
        targetUser._id.equals(request.senderId)
          ? request.receiverId
          : request.senderId,
      ),
    });

    // remove every friend request he sent or received (accepted + pending)
    await this._friendRequestRepository.deleteMany({
      filter: {
        $or: [{ senderId: targetUser._id }, { receiverId: targetUser._id }],
      },
    });

    // remove every redis key related to this user (profile, revoke tokens, otp, login trials)
    const [userIdKeys, userEmailKeys] = await Promise.all([
      this._cacheService.keys({
        prefix: `User::${targetUser._id.toString()}::`,
      }),
      this._cacheService.keys({ prefix: `User::${targetUser.email}::` }),
    ]);

    // always has the profile key → the array is never empty (redis DEL fails with no keys)
    await this._cacheService.del({
      key: [
        ...new Set([
          ...userIdKeys,
          ...userEmailKeys,
          this._tokenService.userBaseProfile({ userId: targetUser._id }),
        ]),
      ],
    });

    // his FCM key is "user:FCM:<id>", so the "User::<id>::" prefix above doesn't catch it
    await this._notificationService.removeFCMUser({ userId: targetUser._id });

    // remove notifications for this account
    await this._notificationRecipientRepository.deleteMany({
      filter: {
        user: targetUser._id,
      },
    });

    // remove his uploaded images from assets
    await this._cloudService.deleteFileDir({
      prefix: `User/${userId.toString()}`,
    });

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

    await this._userRepository.findByIdAndUpdate({
      id: user._id,
      update: { visibility },
    });

    await this._cacheService.del({
      key: this._tokenService.userBaseProfile({ userId: user._id }),
    });

    return visibility;
  }

  async sendFriendRequest({
    body,
    user,
  }: {
    body: dto.SendFriendRequestDto["body"];
    user: models.HUser;
  }) {
    const { userId, note } = body;

    if (user._id.equals(userId)) {
      throw new exceptions.BadRequestException(
        "error.cannotSendFriendRequestToYourself",
      );
    }

    const targetUser = await this._userRepository.findOne({
      filter: { _id: objectId.toObjectId({ id: userId }) },
      projection: "_id",
    });

    if (!targetUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    // any request between the two users, in both directions
    const existingRequest = await this._friendRequestRepository.findOne({
      filter: this.betweenUsers(user._id, targetUser._id),
      projection: "senderId status",
    });

    if (existingRequest) {
      if (existingRequest.status == enums.FriendRequestStatusEnum.ACCEPTED) {
        throw new exceptions.ConflictException("error.alreadyFriends");
      }

      // he already sent me a pending request → I should accept it, not send a new one
      throw new exceptions.ConflictException(
        user._id.equals(existingRequest.senderId)
          ? "error.friendRequestAlreadyExists"
          : "error.friendRequestReceivedFromUser",
      );
    }

    // always pending → the receiver must accept it, visibility does not matter here
    const newRequest = await this._friendRequestRepository.create({
      data: {
        senderId: user._id,
        receiverId: targetUser._id,
        ...(note ? { note } : {}),
        status: enums.FriendRequestStatusEnum.PENDING,
      },
    });

    return newRequest.toJSON();
  }

  async actionToFriendRequest({
    params,
    body,
    user,
  }: {
    params: dto.TakeAnActionToFriendRequestDto["params"];
    body: dto.TakeAnActionToFriendRequestDto["body"];
    user: models.HUser;
  }) {
    const { userId } = params;
    const { action } = body;

    if (user._id.equals(userId)) {
      throw new exceptions.NotFoundException(
        "error.pendingFriendRequestNotFound",
      );
    }

    switch (action) {
      case enums.FriendRequestActionEnum.ACCEPTED: {
        const updateRequest =
          await this._friendRequestRepository.findOneAndUpdate({
            filter: {
              senderId: userId,
              receiverId: user._id,
              status: enums.FriendRequestStatusEnum.PENDING,
            },
            update: {
              status: enums.FriendRequestStatusEnum.ACCEPTED,
            },
          });

        if (!updateRequest) {
          throw new exceptions.NotFoundException(
            "error.pendingFriendRequestNotFound",
          );
        }

        await this.syncFriends({
          action: "add",
          userId: updateRequest.receiverId,
          friendIds: [updateRequest.senderId],
        });

        return "success.friendRequestAccepted";
      }
      case enums.FriendRequestActionEnum.REJECTED: {
        const deleteRequest =
          await this._friendRequestRepository.findOneAndDelete({
            filter: {
              senderId: userId,
              receiverId: user._id,
              status: enums.FriendRequestStatusEnum.PENDING,
            },
          });

        if (!deleteRequest) {
          throw new exceptions.NotFoundException(
            "error.pendingFriendRequestNotFound",
          );
        }

        return "success.friendRequestRejected";
      }

      default:
        throw new exceptions.BadRequestException(
          "validation.friendRequestAction.invalid",
        );
    }
  }

  async cancelFriendRequest({
    params,
    user,
  }: {
    params: dto.CancelFriendRequestDto["params"];
    user: models.HUser;
  }) {
    const { userId } = params;

    if (user._id.equals(userId)) {
      throw new exceptions.BadRequestException(
        "error.cannotCancelFriendRequestToYourself",
      );
    }

    const deletedRequest = await this._friendRequestRepository.findOneAndDelete(
      {
        filter: {
          senderId: user._id,
          receiverId: objectId.toObjectId({ id: userId }),
          // cancel is only for a request that is not accepted yet, an accepted one is removed by removeExistingFriend
          status: enums.FriendRequestStatusEnum.PENDING,
        },
      },
    );

    if (!deletedRequest) {
      throw new exceptions.NotFoundException("error.sentFriendRequestNotFound");
    }

    return;
  }

  // every accepted request where this user is the sender or the receiver → shows the other user
  async friends({
    query,
    params,
    user,
  }: {
    query: dto.GetFriendsDto["query"];
    params: dto.GetFriendsDto["params"];
    user: models.HUser;
  }) {
    const { page, limit } = query;
    const { userId } = params;

    const targetUser = await this._userRepository.findOne({
      filter: { _id: objectId.toObjectId({ id: userId }) },
      projection: "visibility",
    });

    if (!targetUser) {
      throw new exceptions.NotFoundException("error.invalidUser");
    }

    // private account → only his friends can see his friends list
    if (
      targetUser.visibility == enums.AccountVisibilityEnum.PRIVATE &&
      !user._id.equals(targetUser._id)
    ) {
      const isFriend = await this._friendRequestRepository.findOne({
        filter: {
          ...this.betweenUsers(user._id, targetUser._id),
          status: enums.FriendRequestStatusEnum.ACCEPTED,
        },
        projection: "_id",
      });

      if (!isFriend) {
        throw new exceptions.ForbiddenException("error.privateAccount");
      }
    }

    const data = await this._friendRequestRepository.paginate({
      filter: {
        $or: [{ senderId: targetUser._id }, { receiverId: targetUser._id }],
        status: enums.FriendRequestStatusEnum.ACCEPTED,
      },
      options: {
        sort: { createdAt: -1 },
        populate: [
          { path: "senderId", select: "firstName lastName image" },
          { path: "receiverId", select: "firstName lastName image" },
        ],
      },
      page,
      limit,
    });

    type FriendType = { _id: Types.ObjectId } | null;

    return {
      ...data,
      docs: (data.docs as models.HFriendRequest[])
        .map((doc) => {
          const { _id, senderId, receiverId, createdAt } = doc.toJSON() as {
            _id: Types.ObjectId;
            senderId: FriendType;
            receiverId: FriendType;
            createdAt: Date;
          };
          // the friend is the other side of the request (null → archived user)
          const friend = senderId?._id.equals(targetUser._id)
            ? receiverId
            : senderId;
          return friend ? { _id, friend, createdAt } : null;
        })
        .filter((doc) => doc),
    };
  }

  async pendingFriendRequests({
    query,
    user,
  }: {
    query: dto.GetPendingFriendRequestsDto["query"];
    user: models.HUser;
  }) {
    const { page, limit } = query;

    const data = await this._friendRequestRepository.paginate({
      filter: {
        receiverId: user._id,
        status: enums.FriendRequestStatusEnum.PENDING,
      },
      options: {
        sort: { createdAt: -1 },
        populate: { path: "senderId", select: "firstName lastName image" },
      },
      page,
      limit,
    });

    return {
      ...data,
      docs: (data.docs as models.HFriendRequest[])
        .map((doc) => doc.toJSON())
        .filter((doc) => doc["senderId"]),
    };
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

    const data = await this._userRepository.paginate({
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

    const users = await this._userRepository.find({
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

  async removeExistingFriend({
    params,
    user,
  }: {
    params: dto.RemoveExistingFriendDto["params"];
    user: models.HUser;
  }) {
    const { userId } = params;

    if (user._id.equals(userId)) {
      throw new exceptions.BadRequestException("error.cannotRemoveYourself");
    }

    const deletedRequest = await this._friendRequestRepository.findOneAndDelete(
      {
        filter: {
          // any of the two can remove the friendship, whoever sent the request
          ...this.betweenUsers(user._id, objectId.toObjectId({ id: userId })),
          status: enums.FriendRequestStatusEnum.ACCEPTED,
        },
      },
    );

    if (!deletedRequest) {
      throw new exceptions.NotFoundException("error.notFriends");
    }

    await this.syncFriends({
      action: "remove",
      userId: deletedRequest.senderId,
      friendIds: [deletedRequest.receiverId],
    });

    return;
  }
}

export default new UserService();
