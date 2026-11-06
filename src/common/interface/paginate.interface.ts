import { FlattenMaps, HydratedDocument } from "mongoose";

export interface IPaginate<T> {
  totalPages: number;
  docsCount: number;
  currentPage: number;
  limit: number;
  docs: HydratedDocument<T>[] | FlattenMaps<T>[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
