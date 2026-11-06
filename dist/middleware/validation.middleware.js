"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const common_1 = require("../common");
const keyFor = (issue) => {
    switch (issue.code) {
        case "invalid_type":
            return issue.input === undefined
                ? "validation.general.required"
                : "validation.general.invalidType";
        case "unrecognized_keys":
            return "validation.general.unrecognizedKeys";
        default:
            return "validation.general.invalid";
    }
};
const validation = (schema) => {
    return (req, res, next) => {
        const validationResult = schema(req.lang).safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers,
            file: req.file,
            files: req.files,
        }, { error: (issue) => (0, common_1.translate)(req.lang, keyFor(issue)) });
        if (!validationResult.success) {
            throw new common_1.exceptions.BadRequestException("validation.general.error", validationResult.error.issues);
        }
        req.validate = validationResult.data;
        next();
    };
};
exports.validation = validation;
