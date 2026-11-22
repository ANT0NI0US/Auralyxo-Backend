import { models } from "..";
import type { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class FollowRepository extends DatabaseRepository<itf.IFollow> {
  constructor() {
    super(models.FollowModel);
  }
}
