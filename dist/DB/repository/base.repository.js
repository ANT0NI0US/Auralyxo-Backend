"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
const config_service_1 = __importDefault(require("../../config.service"));
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async createOne({ data, options = {}, }) {
        const [doc] = await this.create({
            data: [data],
            options,
        });
        return doc;
    }
    async insertMany({ data, }) {
        return (await this.model.insertMany(data));
    }
    async find({ filter = {}, projection, options, }) {
        const doc = this.model.find(filter, projection);
        if (options?.populate) {
            doc.populate(options.populate);
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
    async findOne({ filter = {}, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async findById({ id, projection, options, }) {
        const doc = this.model.findById(id, projection);
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter || {}, { ...update, $inc: { __v: 1 } }, {
            runValidators: true,
            updatePipeline: true,
            ...options,
        });
    }
    async updateMany({ filter, update, options, }) {
        return await this.model.updateMany(filter, { ...update, $inc: { __v: 1 } }, { runValidators: true, ...options });
    }
    async deleteOne({ filter, options, }) {
        return await this.model.deleteOne(filter, options);
    }
    async deleteMany({ filter, options, }) {
        return await this.model.deleteMany(filter, options);
    }
    async findByIdAndUpdate({ id, update, options, }) {
        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, { returnDocument: "after", runValidators: true, ...options });
    }
    async findOneAndUpdate({ filter, update, options, }) {
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
        return await this.model.findOneAndUpdate(filter || {}, { ...update, $inc: { __v: 1 } }, {
            returnDocument: "after",
            runValidators: true,
            ...options,
        });
    }
    async findByIdAndDelete({ id, options, }) {
        return await this.model.findByIdAndDelete(id, options);
    }
    async findOneAndDelete({ filter, options, }) {
        return await this.model.findOneAndDelete(filter, options);
    }
    async countDocuments({ filter = {}, }) {
        return await this.model.countDocuments(filter);
    }
    async paginate({ filter = {}, options = {}, projection, page = config_service_1.default.PAGE, limit = config_service_1.default.PAGINATION_LIMIT, }) {
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
exports.DatabaseRepository = DatabaseRepository;
