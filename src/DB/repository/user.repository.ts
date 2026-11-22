import { models } from "..";
import type { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class UserRepository extends DatabaseRepository<itf.IUser> {
  constructor() {
    super(models.UserModel);
  }
}
