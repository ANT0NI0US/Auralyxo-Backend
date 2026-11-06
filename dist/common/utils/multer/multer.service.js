"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerUpload = exports.processFields = exports.processArrayFiles = exports.processFile = exports.fileValidation = void 0;
const file_type_1 = require("file-type");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const common_1 = require("../../../common");
const config_service_1 = __importDefault(require("../../../config.service"));
exports.fileValidation = {
    image: ["image/jpg", "image/jpeg", "image/png"],
    files: ["application/json", "application/pdf"],
};
const processFile = async ({ customPath = "general", validation = [], file, }) => {
    if (file.path) {
        file.buffer = await (0, promises_1.readFile)(file.path);
    }
    const result = await (0, file_type_1.fileTypeFromBuffer)(file.buffer);
    if (!result || !validation.includes(result.mime)) {
        if (file.path) {
            await (0, promises_1.unlink)(file.path);
        }
        throw new common_1.exceptions.BadRequestException("error.invalidFileFormat");
    }
    const customFolderPath = (0, node_path_1.resolve)(`./assets/${customPath}`);
    await (0, promises_1.mkdir)(customFolderPath, { recursive: true });
    const uniqueFilePath = `assets/${customPath}/${(0, node_crypto_1.randomUUID)()}.${result.ext}`;
    const filePath = (0, node_path_1.resolve)(`./${uniqueFilePath}`);
    await (0, promises_1.writeFile)(filePath, file.buffer);
    if (file.path) {
        await (0, promises_1.unlink)(file.path);
    }
    file.path = `${config_service_1.default.WEBSITE_URL}${uniqueFilePath}`;
    return file;
};
exports.processFile = processFile;
const processArrayFiles = async ({ customPath = "general", validation = [], files = [], }) => {
    const uploadedFiles = [];
    for (const file of files) {
        const uploadFile = await (0, exports.processFile)({ customPath, validation, file });
        uploadedFiles.push(uploadFile);
    }
    return uploadedFiles;
};
exports.processArrayFiles = processArrayFiles;
const processFields = async ({ customPath = "general", validation = [], fields, }) => {
    const assets = [];
    for (const field of Object.keys(fields)) {
        const uploadedFiles = await (0, exports.processArrayFiles)({
            customPath,
            validation,
            files: fields[field],
        });
        assets.push({ key: field, uploadedFiles });
    }
    return assets;
};
exports.processFields = processFields;
const multerUpload = async ({ req, customPath = "general", validation = [], }) => {
    if (req.file) {
        await (0, exports.processFile)({ customPath, validation, file: req.file });
    }
    else if (Array.isArray(req.files)) {
        await (0, exports.processArrayFiles)({ customPath, validation, files: req.files });
    }
    else if (req.files &&
        typeof req.files == "object" &&
        Object.keys(req.files)?.length > 0) {
        await (0, exports.processFields)({ customPath, validation, fields: req.files });
    }
};
exports.multerUpload = multerUpload;
