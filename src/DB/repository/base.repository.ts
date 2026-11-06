import mongoose, {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  MongooseBaseQueryOptions,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from "mongoose";
import { itf } from "../../common";
import configService from "../../config.service";

export abstract class DatabaseRepository<TRawDocType> {
  constructor(protected model: Model<TRawDocType>) {}

  // ------------------------------------------------ CREATE --------------------------------------------------- //
  // create with single document.
  async create({
    data,
  }: {
    // ana hna 7tyt AnyKeys 34an anta fy al create m4 lazm tdylo kol 7aga fy 7agat options
    data: AnyKeys<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType>>;

  // create with array of documents with options.
  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDocType>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDocType>[]>;

  // the actual implementation of the create by prototype overloading
  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDocType> | AnyKeys<TRawDocType>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDocType> | HydratedDocument<TRawDocType>[]> {
    return await this.model.create(data as any, options);
  }

  async createOne({
    data,
    options = {},
  }: {
    data: AnyKeys<TRawDocType>;
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDocType>> {
    const [doc] = await this.create({
      data: [data],
      options,
    });
    return doc as HydratedDocument<TRawDocType>;
  }
  // -------------------------------------------------- INSERT MANY ----------------------------------------------------- //
  async insertMany({
    data,
  }: {
    data: AnyKeys<TRawDocType>[];
  }): Promise<HydratedDocument<TRawDocType>[]> {
    return (await this.model.insertMany(
      data as any,
    )) as HydratedDocument<TRawDocType>[];
  }
  // -------------------------------------------------- FIND ----------------------------------------------------- //
  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: QueryOptions<TRawDocType> | null | undefined;
  }): Promise<HydratedDocument<TRawDocType>[]>;

  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDocType>[]>;

  async find({
    filter = {},
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: QueryOptions<TRawDocType> | null | undefined;
  }): Promise<HydratedDocument<TRawDocType>[] | FlattenMaps<TRawDocType>[]> {
    const doc = this.model.find(filter, projection);
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.skip) {
      doc.skip(options.skip);
    }

    if (options?.limit) {
      doc.limit(options.limit);
    }

    if (options?.sort) {
      doc.sort(options.sort);
    }

    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }
  // ------------------------------------------------ FIND ONE --------------------------------------------------- //

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDocType> | null | undefined>;

  async findOne({
    filter = {},
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?:
      | (QueryOptions<TRawDocType> & { lean?: boolean })
      | null
      | undefined;
  }): Promise<
    HydratedDocument<TRawDocType> | FlattenMaps<TRawDocType> | null | undefined
  > {
    const doc = this.model.findOne(filter, projection);
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  // ------------------------------------------------ FIND BY ID --------------------------------------------------- //

  async findById({
    id,
    projection,
    options,
  }: {
    id: mongoose.Types.ObjectId;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined>;

  async findById({
    id,
    projection,
    options,
  }: {
    id: mongoose.Types.ObjectId;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDocType> | null | undefined>;

  async findById({
    id,
    projection,
    options,
  }: {
    id: mongoose.Types.ObjectId;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: QueryOptions<TRawDocType> | null | undefined;
  }): Promise<
    HydratedDocument<TRawDocType> | FlattenMaps<TRawDocType> | null | undefined
  > {
    const doc = this.model.findById(id, projection);
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  // ------------------------------------------------ UPDATE ONE --------------------------------------------------- //

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDocType> | null;
  }): Promise<UpdateWriteOpResult> {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
      return await this.model.updateOne(filter || {}, update, {
        runValidators: true,
        updatePipeline: true,
        ...options,
      });
    }
    return await this.model.updateOne(
      filter || {},
      { ...update, $inc: { ...update.$inc, __v: 1 } },
      { runValidators: true, ...options },
    );
  }

  // ------------------------------------------------ UPDATE MANY --------------------------------------------------- //

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDocType> | null;
  }): Promise<UpdateWriteOpResult> {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
      return await this.model.updateMany(filter, update, {
        runValidators: true,
        updatePipeline: true,
        ...options,
      });
    }
    return await this.model.updateMany(
      filter,
      { ...update, $inc: { ...update.$inc, __v: 1 } },
      { runValidators: true, ...options },
    );
  }

  // ------------------------------------------------ DELETE ONE --------------------------------------------------- //

  async deleteOne({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: MongooseBaseQueryOptions<TRawDocType> | null;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter, options);
  }

  // ------------------------------------------------ DELETE MANY --------------------------------------------------- //
  async deleteMany({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: MongooseBaseQueryOptions<TRawDocType> | null;
  }): Promise<DeleteResult>;

  async deleteMany({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: MongooseBaseQueryOptions<TRawDocType> | null;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter, options);
  }

  // ------------------------------------------------ FIND BY ID AND UPDATE --------------------------------------------------- //
  async findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: mongoose.Types.ObjectId;
    update?: UpdateQuery<TRawDocType>;
    options?: QueryOptions<TRawDocType> | null;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined> {
    return await this.model.findByIdAndUpdate(
      id,
      { ...update, $inc: { ...update?.$inc, __v: 1 } },
      { returnDocument: "after", runValidators: true, ...options },
    );
  }

  // ------------------------------------------------ FIND ONE AND UPDATE --------------------------------------------------- //
  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    update?: UpdateQuery<TRawDocType>;
    options?: QueryOptions<TRawDocType> | null;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined> {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
      return await this.model.findOneAndUpdate(filter || {}, update, {
        returnDocument: "after",
        runValidators: true,
        updatePipeline: true,
        ...options,
      });
    }
    return await this.model.findOneAndUpdate(
      filter || {},
      { ...update, $inc: { ...update?.$inc, __v: 1 } },
      {
        returnDocument: "after",
        runValidators: true,
        ...options,
      },
    );
  }

  // ------------------------------------------------ FIND BY ID AND DELETE --------------------------------------------------- //
  async findByIdAndDelete({
    id,
    options,
  }: {
    id: mongoose.Types.ObjectId;
    options?: QueryOptions<TRawDocType> | null;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined> {
    return await this.model.findByIdAndDelete(id, options);
  }

  // ------------------------------------------------ FIND ONE AND DELETE --------------------------------------------------- //
  async findOneAndDelete({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: QueryOptions<TRawDocType> | null;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined> {
    return await this.model.findOneAndDelete(filter, options);
  }

  // ------------------------------------------------ COUNT DOCUMENTS --------------------------------------------------- //
  async countDocuments({
    filter = {},
  }: {
    filter: QueryFilter<TRawDocType>;
  }): Promise<number> {
    return await this.model.countDocuments(filter);
  }
  // ------------------------------------------------ PAGINATE --------------------------------------------------- //
  async paginate({
    filter = {},
    options = {},
    projection,
    page = configService.PAGE,
    limit = configService.PAGINATION_LIMIT,
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: QueryOptions<TRawDocType> | null;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    page?: number;
    limit?: number;
  }): Promise<itf.IPaginate<TRawDocType>> {
    const skip = (page - 1) * limit;
    const docsCount = await this.countDocuments({ filter });

    const totalPages = Math.ceil(docsCount / limit);

    const docs = await this.find({
      filter: filter || {},
      projection,
      options: {
        skip,
        limit,
        ...options,
      },
    });

    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    return {
      totalPages,
      docsCount,
      currentPage: page,
      limit,
      docs,
      hasNextPage,
      hasPreviousPage,
    };
  }
}
