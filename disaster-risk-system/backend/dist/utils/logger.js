"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildLogger = exports.formatError = exports.businessLog = exports.apiLog = exports.dbLog = exports.log = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const transports = [
    new winston_1.default.transports.Console({
        format
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: fileFormat
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
        format: fileFormat
    })
];
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports
});
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
exports.log = {
    error: (message, meta) => {
        logger.error(message, meta);
    },
    warn: (message, meta) => {
        logger.warn(message, meta);
    },
    info: (message, meta) => {
        logger.info(message, meta);
    },
    http: (message, meta) => {
        logger.http(message, meta);
    },
    debug: (message, meta) => {
        logger.debug(message, meta);
    }
};
exports.dbLog = {
    query: (sql, params, duration) => {
        logger.info(`DB Query: ${sql}`, { params, duration });
    },
    error: (error, sql, params) => {
        logger.error(`DB Error: ${error.message}`, { sql, params, stack: error.stack });
    },
    transaction: (action, duration) => {
        logger.info(`DB Transaction: ${action}`, { duration });
    }
};
exports.apiLog = {
    request: (method, url, ip, userAgent) => {
        logger.http(`${method} ${url}`, { ip, userAgent });
    },
    response: (method, url, statusCode, duration) => {
        logger.http(`${method} ${url} - ${statusCode}`, { duration });
    },
    error: (method, url, error, statusCode) => {
        logger.error(`${method} ${url} - Error: ${error.message}`, {
            statusCode,
            stack: error.stack
        });
    }
};
exports.businessLog = {
    userAction: (userId, action, details) => {
        logger.info(`User Action: ${action}`, { userId, details });
    },
    systemEvent: (event, details) => {
        logger.info(`System Event: ${event}`, details);
    },
    securityEvent: (event, ip, details) => {
        logger.warn(`Security Event: ${event}`, { ip, details });
    },
    performanceMetric: (metric, value, unit) => {
        logger.info(`Performance: ${metric} = ${value}${unit}`);
    }
};
const formatError = (error) => {
    return `${error.name}: ${error.message}\nStack: ${error.stack}`;
};
exports.formatError = formatError;
const createChildLogger = (service) => {
    return {
        error: (message, meta) => {
            logger.error(`[${service}] ${message}`, meta);
        },
        warn: (message, meta) => {
            logger.warn(`[${service}] ${message}`, meta);
        },
        info: (message, meta) => {
            logger.info(`[${service}] ${message}`, meta);
        },
        debug: (message, meta) => {
            logger.debug(`[${service}] ${message}`, meta);
        }
    };
};
exports.createChildLogger = createChildLogger;
exports.default = logger;
//# sourceMappingURL=logger.js.map