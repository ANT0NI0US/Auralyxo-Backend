"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadMiddleware = void 0;
const common_1 = require("../common");
const fileUploadMiddleware = ({ isRequired = true, customPath = "general", multerMiddleware, validation = [], }) => {
    return async (req, res, next) => {
        multerMiddleware(req, res, async (error) => {
            try {
                if (error) {
                    throw new common_1.exceptions.BadRequestException(error.message);
                }
                if (isRequired &&
                    !req.file &&
                    !(Array.isArray(req.files) && req.files.length > 0) &&
                    !(typeof req.files == "object" && Object.keys(req.files).length > 0)) {
                    throw new common_1.exceptions.BadRequestException("error.fileRequired");
                }
                await common_1.fileUpload.multerUpload({ req, customPath, validation });
                next();
            }
            catch (error) {
                next(error);
            }
        });
    };
};
exports.fileUploadMiddleware = fileUploadMiddleware;
