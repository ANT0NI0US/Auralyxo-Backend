import z from "zod";
import * as validators from "../user.validation";

export type GetAllUsersDto = z.infer<ReturnType<typeof validators.getAllUsers>>;
export type GetUserDto = z.infer<ReturnType<typeof validators.getUser>>;
export type UpdateDto = z.infer<ReturnType<typeof validators.update>>;
export type ShareProfileDto = z.infer<
  ReturnType<typeof validators.shareProfile>
>;
export type ProfileImageDto = z.infer<
  ReturnType<typeof validators.profileImage>
>;
export type ToggleAccountStatusDto = z.infer<
  ReturnType<typeof validators.toggleAccountStatus>
>;
export type CoverImagesDto = z.infer<ReturnType<typeof validators.coverImages>>;
export type DeleteUserDto = z.infer<ReturnType<typeof validators.deleteUser>>;
export type ToggleVisibilityDto = z.infer<
  ReturnType<typeof validators.toggleVisibility>
>;
// Follow / Unfollow
export type FollowAccountDto = z.infer<
  ReturnType<typeof validators.followAccount>
>;
export type UnFollowAccountDto = z.infer<
  ReturnType<typeof validators.unFollowAccount>
>;
export type GetFollowersDto = z.infer<
  ReturnType<typeof validators.getFollowers>
>;
export type GetFollowingsDto = z.infer<
  ReturnType<typeof validators.getFollowings>
>;
export type GetFollowRequestsDto = z.infer<
  ReturnType<typeof validators.getFollowRequests>
>;
export type TakeAnActionToRequestDto = z.infer<
  ReturnType<typeof validators.takeAnActionToRequest>
>;
export type SearchUsersDto = z.infer<ReturnType<typeof validators.searchUsers>>;
export type GetSuggestionsDto = z.infer<
  ReturnType<typeof validators.getSuggestions>
>;
export type RemoveExistingFollowerDto = z.infer<
  ReturnType<typeof validators.removeExistingFollower>
>;
