"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const toObjectId = ({ id }) => {
    return mongoose_1.default.Types.ObjectId.createFromHexString(id);
};
exports.toObjectId = toObjectId;
