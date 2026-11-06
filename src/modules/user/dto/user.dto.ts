import z from "zod";
import * as validators from "../user.validation";

export type GetAllUsersDto = z.infer<ReturnType<typeof validators.getAllUsers>>;
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
export type DeleteUserDto = z.infer<ReturnType<typeof validators.deleteUser>>;
