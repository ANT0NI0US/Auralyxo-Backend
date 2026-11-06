import { models } from "..";
import { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class UserRepository extends DatabaseRepository<itf.IUser> {
  constructor() {
    super(models.UserModel);
  }
}
