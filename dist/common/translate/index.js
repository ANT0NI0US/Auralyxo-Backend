"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate = void 0;
const enum_1 = require("../enum");
const ar_json_1 = __importDefault(require("./ar.json"));
const en_json_1 = __importDefault(require("./en.json"));
const dictionaries = {
    [enum_1.LanguageEnum.AR]: ar_json_1.default,
    [enum_1.LanguageEnum.EN]: en_json_1.default,
};
const translate = (lang, key) => {
    const dictionary = dictionaries[lang] ?? dictionaries[enum_1.LanguageEnum.EN];
    const message = key
        .split(".")
        .reduce((node, part) => node && typeof node === "object"
        ? node[part]
        : undefined, dictionary);
    return typeof message === "string" ? message : key;
};
exports.translate = translate;
