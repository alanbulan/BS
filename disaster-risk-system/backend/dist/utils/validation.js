"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateGeometry = exports.validateChinaCoordinates = exports.commonValidations = exports.validateParams = exports.validateQuery = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const response_1 = require("./response");
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
            (0, response_1.validationErrorResponse)(res, errors);
            return;
        }
        next();
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.query, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
            (0, response_1.validationErrorResponse)(res, errors);
            return;
        }
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.params, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
            (0, response_1.validationErrorResponse)(res, errors);
            return;
        }
        next();
    };
};
exports.validateParams = validateParams;
exports.commonValidations = {
    id: joi_1.default.number().integer().positive().required(),
    pagination: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10)
    },
    coordinates: {
        longitude: joi_1.default.number().min(-180).max(180).required(),
        latitude: joi_1.default.number().min(-90).max(90).required()
    },
    timeRange: {
        startTime: joi_1.default.date().iso().required(),
        endTime: joi_1.default.date().iso().min(joi_1.default.ref('startTime')).required()
    },
    riskLevel: joi_1.default.number().integer().min(1).max(5),
    username: joi_1.default.string().alphanum().min(3).max(30).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]')).required()
        .messages({
        'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'
    }),
    phone: joi_1.default.string().pattern(/^1[3-9]\d{9}$/).messages({
        'string.pattern.base': '请输入有效的手机号码'
    }),
    geometry: joi_1.default.object({
        type: joi_1.default.string().valid('Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon').required(),
        coordinates: joi_1.default.array().required()
    }),
    file: {
        mimetype: joi_1.default.string().valid('image/jpeg', 'image/png', 'image/gif', 'application/pdf'),
        size: joi_1.default.number().max(10 * 1024 * 1024)
    }
};
const validateChinaCoordinates = (longitude, latitude) => {
    const chinaBounds = {
        minLng: 73.66,
        maxLng: 135.05,
        minLat: 3.86,
        maxLat: 53.55
    };
    return longitude >= chinaBounds.minLng && longitude <= chinaBounds.maxLng &&
        latitude >= chinaBounds.minLat && latitude <= chinaBounds.maxLat;
};
exports.validateChinaCoordinates = validateChinaCoordinates;
const validateGeometry = (geometry) => {
    if (!geometry || typeof geometry !== 'object') {
        return false;
    }
    const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    if (!validTypes.includes(geometry.type)) {
        return false;
    }
    if (!Array.isArray(geometry.coordinates)) {
        return false;
    }
    return true;
};
exports.validateGeometry = validateGeometry;
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim();
    }
    if (Array.isArray(input)) {
        return input.map(exports.sanitizeInput);
    }
    if (input && typeof input === 'object') {
        const sanitized = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                sanitized[key] = (0, exports.sanitizeInput)(input[key]);
            }
        }
        return sanitized;
    }
    return input;
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=validation.js.map