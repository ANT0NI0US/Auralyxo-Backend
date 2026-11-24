import { models } from "..";
import type { itf } from "../../common";
import { DatabaseRepository } from "./base.repository";

export class FriendRequestRepository extends DatabaseRepository<itf.IFriendRequest> {
  constructor() {
    super(models.FriendRequestModel);
  }
}
