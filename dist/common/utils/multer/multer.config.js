"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploader = void 0;
const multer_1 = __importDefault(require("multer"));
const node_crypto_1 = require("node:crypto");
const node_os_1 = require("node:os");
const __1 = require("../..");
const createUploader = ({ maxFileSize = 5, storageApproach = __1.enums.StorageApproachEnum.MEMORY, }) => {
    const storage = storageApproach == __1.enums.StorageApproachEnum.MEMORY
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: async function (req, file, cb) {
                cb(null, (0, node_os_1.tmpdir)());
            },
            filename: function (req, file, cb) {
                cb(null, (0, node_crypto_1.randomUUID)() + "__" + file.originalname);
            },
        });
    return (0, multer_1.default)({
        storage,
        limits: { fileSize: maxFileSize * 1024 * 1024 },
    });
};
exports.createUploader = createUploader;
