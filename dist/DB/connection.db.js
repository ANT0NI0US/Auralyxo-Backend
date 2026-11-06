"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const _1 = require(".");
const common_1 = require("../common");
const config_service_1 = __importDefault(require("../config.service"));
const BootstrapDB = async (app) => {
    try {
        await mongoose_1.default.connect(config_service_1.default.DB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("DB CONNECTED 💥");
        await _1.models.UserModel.syncIndexes();
        await common_1.services.cacheService.connectRedis();
        app.listen(config_service_1.default.PORT, () => {
            console.log(`we are running on port ${config_service_1.default.PORT}`);
        });
    }
    catch (error) {
        console.log("FAILED TO CONNECT DB ✖");
        console.log(error);
        process.exit(1);
    }
};
exports.BootstrapDB = BootstrapDB;
