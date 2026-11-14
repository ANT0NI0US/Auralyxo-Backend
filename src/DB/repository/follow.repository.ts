import { models } from "..";
import { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class FollowRepository extends DatabaseRepository<itf.IFollow> {
  constructor() {
    super(models.FollowModel);
  }
}
