"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const common_1 = require("./common");
const connection_db_1 = require("./DB/connection.db");
const middleware = __importStar(require("./middleware"));
const modules = __importStar(require("./modules"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
(0, connection_db_1.BootstrapDB)(app);
app.use((0, cors_1.default)(), middleware.language, express_1.default.json());
app.use("/assets", express_1.default.static("./assets"));
app.all("/", (req, res, next) => {
    return res.status(200).json({ message: "Done" });
});
app.use("/auth", modules.authController);
app.use("/user", modules.userController);
app.all("{/*dummy}", (req, res, next) => {
    res.status(404).json({
        message: (0, common_1.translate)(req.lang, "error.routeNotFound"),
    });
});
app.use(middleware.globalErrorHandling);
