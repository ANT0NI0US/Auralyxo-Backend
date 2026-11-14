import { enums } from "../../common";

export interface IUser {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password?: string;
  phone?: string;
  DOB?: Date;
  confirmEmail?: Date;
  image?: string;
  coverImages?: string[];
  gender: enums.GenderEnum;
  role: enums.RoleEnum;
  provider: enums.ProviderEnum;
  changeCredentialsTime?: Date;
  twoStepVerification?: boolean;
  status: enums.AccountStatusEnum;
  changeStatusAt?: Date;
  visibility: enums.AccountVisibilityEnum;
  createdAt?: Date;
  updatedAt?: Date;
}
