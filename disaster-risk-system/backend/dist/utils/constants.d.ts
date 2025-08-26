export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare const RESPONSE_MESSAGES: {
    readonly SUCCESS: "操作成功";
    readonly CREATED: "创建成功";
    readonly UPDATED: "更新成功";
    readonly DELETED: "删除成功";
    readonly NOT_FOUND: "资源不存在";
    readonly UNAUTHORIZED: "未授权访问";
    readonly FORBIDDEN: "禁止访问";
    readonly BAD_REQUEST: "请求参数错误";
    readonly INTERNAL_ERROR: "服务器内部错误";
    readonly VALIDATION_ERROR: "数据验证失败";
    readonly DUPLICATE_ERROR: "数据已存在";
    readonly RATE_LIMIT_EXCEEDED: "请求频率超限";
    readonly FILE_UPLOAD_ERROR: "文件上传失败";
    readonly FILE_NOT_FOUND: "文件不存在";
    readonly INVALID_TOKEN: "无效的令牌";
    readonly TOKEN_EXPIRED: "令牌已过期";
    readonly INSUFFICIENT_PERMISSIONS: "权限不足";
};
export declare const USER_ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly ADMIN: "admin";
    readonly OPERATOR: "operator";
    readonly VIEWER: "viewer";
    readonly USER: "user";
};
export declare const USER_STATUS: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly SUSPENDED: "suspended";
    readonly PENDING: "pending";
};
export declare const DISASTER_TYPES: {
    readonly FLOOD: "flood";
    readonly EARTHQUAKE: "earthquake";
    readonly TYPHOON: "typhoon";
    readonly FIRE: "fire";
    readonly LANDSLIDE: "landslide";
    readonly DROUGHT: "drought";
    readonly STORM: "storm";
    readonly TSUNAMI: "tsunami";
    readonly VOLCANIC: "volcanic";
    readonly OTHER: "other";
};
export declare const RISK_LEVELS: {
    readonly VERY_LOW: 1;
    readonly LOW: 2;
    readonly MEDIUM: 3;
    readonly HIGH: 4;
    readonly VERY_HIGH: 5;
    readonly EXTREME: 6;
};
export declare const RISK_LEVEL_LABELS: {
    readonly 1: "极低";
    readonly 2: "低";
    readonly 3: "中";
    readonly 4: "高";
    readonly 5: "极高";
    readonly 6: "极端";
};
export declare const RISK_LEVEL_COLORS: {
    readonly 1: "#00FF00";
    readonly 2: "#FFFF00";
    readonly 3: "#FFA500";
    readonly 4: "#FF4500";
    readonly 5: "#FF0000";
    readonly 6: "#8B0000";
};
export declare const WARNING_LEVELS: {
    readonly BLUE: "blue";
    readonly YELLOW: "yellow";
    readonly ORANGE: "orange";
    readonly RED: "red";
};
export declare const WARNING_LEVEL_LABELS: {
    readonly blue: "蓝色预警";
    readonly yellow: "黄色预警";
    readonly orange: "橙色预警";
    readonly red: "红色预警";
};
export declare const WARNING_STATUS: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly EXPIRED: "expired";
    readonly CANCELLED: "cancelled";
};
export declare const STATION_STATUS: {
    readonly ONLINE: "online";
    readonly OFFLINE: "offline";
    readonly MAINTENANCE: "maintenance";
    readonly ERROR: "error";
};
export declare const MONITORING_DATA_TYPES: {
    readonly TEMPERATURE: "temperature";
    readonly HUMIDITY: "humidity";
    readonly PRESSURE: "pressure";
    readonly WIND_SPEED: "wind_speed";
    readonly WIND_DIRECTION: "wind_direction";
    readonly RAINFALL: "rainfall";
    readonly WATER_LEVEL: "water_level";
    readonly SOIL_MOISTURE: "soil_moisture";
    readonly SEISMIC_ACTIVITY: "seismic_activity";
    readonly AIR_QUALITY: "air_quality";
};
export declare const FILE_TYPES: {
    readonly IMAGE: "image";
    readonly DOCUMENT: "document";
    readonly VIDEO: "video";
    readonly AUDIO: "audio";
    readonly ARCHIVE: "archive";
    readonly DATA: "data";
    readonly OTHER: "other";
};
export declare const FILE_STATUS: {
    readonly UPLOADING: "uploading";
    readonly UPLOADED: "uploaded";
    readonly PROCESSING: "processing";
    readonly PROCESSED: "processed";
    readonly ERROR: "error";
    readonly DELETED: "deleted";
};
export declare const ROUTE_STATUS: {
    readonly AVAILABLE: "available";
    readonly BLOCKED: "blocked";
    readonly RESTRICTED: "restricted";
    readonly UNDER_CONSTRUCTION: "under_construction";
    readonly DAMAGED: "damaged";
};
export declare const SHELTER_STATUS: {
    readonly AVAILABLE: "available";
    readonly FULL: "full";
    readonly CLOSED: "closed";
    readonly DAMAGED: "damaged";
    readonly MAINTENANCE: "maintenance";
};
export declare const SHELTER_TYPES: {
    readonly SCHOOL: "school";
    readonly COMMUNITY_CENTER: "community_center";
    readonly SPORTS_FACILITY: "sports_facility";
    readonly GOVERNMENT_BUILDING: "government_building";
    readonly RELIGIOUS_FACILITY: "religious_facility";
    readonly TEMPORARY: "temporary";
    readonly OTHER: "other";
};
export declare const REPORT_STATUS: {
    readonly PENDING: "pending";
    readonly VERIFIED: "verified";
    readonly INVESTIGATING: "investigating";
    readonly RESOLVED: "resolved";
    readonly REJECTED: "rejected";
};
export declare const REPORT_TYPES: {
    readonly DISASTER: "disaster";
    readonly INFRASTRUCTURE: "infrastructure";
    readonly SAFETY: "safety";
    readonly ENVIRONMENTAL: "environmental";
    readonly OTHER: "other";
};
export declare const REPORT_PRIORITIES: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly URGENT: "urgent";
};
export declare const CONFIG_TYPES: {
    readonly SYSTEM: "system";
    readonly NOTIFICATION: "notification";
    readonly SECURITY: "security";
    readonly MONITORING: "monitoring";
    readonly ALERT: "alert";
    readonly INTEGRATION: "integration";
};
export declare const NOTIFICATION_TYPES: {
    readonly EMAIL: "email";
    readonly SMS: "sms";
    readonly PUSH: "push";
    readonly WEBHOOK: "webhook";
    readonly SYSTEM: "system";
};
export declare const NOTIFICATION_STATUS: {
    readonly PENDING: "pending";
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export declare const LOG_LEVELS: {
    readonly ERROR: "error";
    readonly WARN: "warn";
    readonly INFO: "info";
    readonly HTTP: "http";
    readonly DEBUG: "debug";
};
export declare const OPERATION_TYPES: {
    readonly CREATE: "create";
    readonly READ: "read";
    readonly UPDATE: "update";
    readonly DELETE: "delete";
    readonly LOGIN: "login";
    readonly LOGOUT: "logout";
    readonly EXPORT: "export";
    readonly IMPORT: "import";
};
export declare const TABLE_NAMES: {
    readonly USERS: "users";
    readonly DISASTER_TYPES: "disaster_types";
    readonly RISK_ZONES: "risk_zones";
    readonly RISK_ASSESSMENTS: "risk_assessments";
    readonly MONITORING_STATIONS: "monitoring_stations";
    readonly MONITORING_DATA: "monitoring_data";
    readonly WARNINGS: "warnings";
    readonly SHELTERS: "shelters";
    readonly ESCAPE_ROUTES: "escape_routes";
    readonly ROAD_NETWORKS: "road_networks";
    readonly USER_REPORTS: "user_reports";
    readonly FILES: "files";
    readonly SYSTEM_CONFIGS: "system_configs";
    readonly REFRESH_TOKENS: "refresh_tokens";
    readonly PASSWORD_RESET_TOKENS: "password_reset_tokens";
};
export declare const CACHE_KEYS: {
    readonly USER: "user:";
    readonly SESSION: "session:";
    readonly RATE_LIMIT: "rate_limit:";
    readonly CONFIG: "config:";
    readonly MONITORING: "monitoring:";
    readonly WARNING: "warning:";
    readonly ROUTE: "route:";
    readonly SHELTER: "shelter:";
};
export declare const CACHE_TTL: {
    readonly SHORT: 300;
    readonly MEDIUM: 1800;
    readonly LONG: 3600;
    readonly VERY_LONG: 86400;
    readonly SESSION: 7200;
    readonly CONFIG: 3600;
    readonly MONITORING: 300;
    readonly WARNING: 600;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly MIN_LIMIT: 1;
};
export declare const COORDINATE_SYSTEMS: {
    readonly WGS84: "WGS84";
    readonly GCJ02: "GCJ02";
    readonly BD09: "BD09";
};
export declare const GEOMETRY_TYPES: {
    readonly POINT: "Point";
    readonly LINE_STRING: "LineString";
    readonly POLYGON: "Polygon";
    readonly MULTI_POINT: "MultiPoint";
    readonly MULTI_LINE_STRING: "MultiLineString";
    readonly MULTI_POLYGON: "MultiPolygon";
};
export declare const UNITS: {
    readonly DISTANCE: {
        readonly METER: "m";
        readonly KILOMETER: "km";
        readonly MILE: "mi";
        readonly FOOT: "ft";
    };
    readonly TEMPERATURE: {
        readonly CELSIUS: "°C";
        readonly FAHRENHEIT: "°F";
        readonly KELVIN: "K";
    };
    readonly PRESSURE: {
        readonly PASCAL: "Pa";
        readonly HECTOPASCAL: "hPa";
        readonly MILLIBAR: "mbar";
        readonly ATMOSPHERE: "atm";
    };
    readonly SPEED: {
        readonly METER_PER_SECOND: "m/s";
        readonly KILOMETER_PER_HOUR: "km/h";
        readonly MILE_PER_HOUR: "mph";
        readonly KNOT: "kn";
    };
};
export declare const TIME_FORMATS: {
    readonly ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ";
    readonly DATE_ONLY: "YYYY-MM-DD";
    readonly TIME_ONLY: "HH:mm:ss";
    readonly DATETIME: "YYYY-MM-DD HH:mm:ss";
    readonly CHINESE_DATE: "YYYY年MM月DD日";
    readonly CHINESE_DATETIME: "YYYY年MM月DD日 HH:mm:ss";
};
export declare const REGEX_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly PHONE: RegExp;
    readonly PASSWORD: RegExp;
    readonly USERNAME: RegExp;
    readonly CHINESE_NAME: RegExp;
    readonly ID_CARD: RegExp;
    readonly COORDINATE: RegExp;
    readonly IP_ADDRESS: RegExp;
    readonly URL: RegExp;
};
export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR";
    readonly AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR";
    readonly NOT_FOUND_ERROR: "NOT_FOUND_ERROR";
    readonly DUPLICATE_ERROR: "DUPLICATE_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR";
    readonly FILE_ERROR: "FILE_ERROR";
    readonly RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare const ENVIRONMENTS: {
    readonly DEVELOPMENT: "development";
    readonly TESTING: "testing";
    readonly STAGING: "staging";
    readonly PRODUCTION: "production";
};
export declare const API_VERSIONS: {
    readonly V1: "v1";
    readonly V2: "v2";
};
export declare const DEFAULTS: {
    readonly LANGUAGE: "zh-CN";
    readonly TIMEZONE: "Asia/Shanghai";
    readonly PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly SESSION_TIMEOUT: 7200;
    readonly TOKEN_EXPIRY: 86400;
    readonly REFRESH_TOKEN_EXPIRY: 604800;
    readonly PASSWORD_RESET_EXPIRY: 3600;
    readonly VERIFICATION_CODE_EXPIRY: 300;
    readonly FILE_UPLOAD_MAX_SIZE: number;
    readonly RATE_LIMIT_WINDOW: 900;
    readonly RATE_LIMIT_MAX_REQUESTS: 100;
};
//# sourceMappingURL=constants.d.ts.map