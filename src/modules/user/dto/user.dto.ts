import z from "zod";
import type * as validators from "../user.validation";

export type GetAllUsersDto = z.infer<ReturnType<typeof validators.getAllUsers>>;
export type GetUserDto = z.infer<ReturnType<typeof validators.getUser>>;
export type UpdateDto = z.infer<ReturnType<typeof validators.update>>;
export type UpdatePreferredLanguageDto = z.infer<
  ReturnType<typeof validators.updatePreferredLanguage>
>;
export type ShareProfileDto = z.infer<
  ReturnType<typeof validators.shareProfile>
>;
export type ProfileImageDto = z.infer<
  ReturnType<typeof validators.profileImage>
>;
export type ProfileImagePreAssignedDto = z.infer<
  ReturnType<typeof validators.profileImagePreAssigned>
>;
export type ToggleAccountStatusDto = z.infer<
  ReturnType<typeof validators.toggleAccountStatus>
>;
export type CoverImagesDto = z.infer<ReturnType<typeof validators.coverImages>>;
export type DeleteUserDto = z.infer<ReturnType<typeof validators.deleteUser>>;
export type ToggleVisibilityDto = z.infer<
  ReturnType<typeof validators.toggleVisibility>
>;
// Friend requests
export type SendFriendRequestDto = z.infer<
  ReturnType<typeof validators.sendFriendRequest>
>;
export type CancelFriendRequestDto = z.infer<
  ReturnType<typeof validators.cancelFriendRequest>
>;
export type GetFriendsDto = z.infer<ReturnType<typeof validators.getFriends>>;
export type GetPendingFriendRequestsDto = z.infer<
  ReturnType<typeof validators.getPendingFriendRequests>
>;
export type TakeAnActionToFriendRequestDto = z.infer<
  ReturnType<typeof validators.takeAnActionToFriendRequest>
>;
export type SearchUsersDto = z.infer<ReturnType<typeof validators.searchUsers>>;
export type GetSuggestionsDto = z.infer<
  ReturnType<typeof validators.getSuggestions>
>;
export type RemoveExistingFriendDto = z.infer<
  ReturnType<typeof validators.removeExistingFriend>
>;
