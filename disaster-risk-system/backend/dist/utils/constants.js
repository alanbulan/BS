"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULTS = exports.API_VERSIONS = exports.ENVIRONMENTS = exports.ERROR_CODES = exports.REGEX_PATTERNS = exports.TIME_FORMATS = exports.UNITS = exports.GEOMETRY_TYPES = exports.COORDINATE_SYSTEMS = exports.PAGINATION = exports.CACHE_TTL = exports.CACHE_KEYS = exports.TABLE_NAMES = exports.OPERATION_TYPES = exports.LOG_LEVELS = exports.NOTIFICATION_STATUS = exports.NOTIFICATION_TYPES = exports.CONFIG_TYPES = exports.REPORT_PRIORITIES = exports.REPORT_TYPE_LABELS = exports.REPORT_TYPES = exports.SEVERITY_LEVEL_LABELS = exports.SEVERITY_LEVELS = exports.VERIFICATION_STATUS_LABELS = exports.VERIFICATION_STATUSES = exports.REPORT_STATUS = exports.SHELTER_TYPES = exports.SHELTER_STATUS = exports.ROUTE_STATUS = exports.FILE_STATUS = exports.FILE_TYPES = exports.MONITORING_DATA_TYPES = exports.STATION_STATUS = exports.WARNING_STATUS = exports.WARNING_LEVEL_LABELS = exports.WARNING_LEVELS = exports.RISK_LEVEL_COLORS = exports.RISK_LEVEL_LABELS = exports.RISK_LEVELS = exports.DISASTER_TYPES = exports.USER_STATUS = exports.USER_ROLES = exports.RESPONSE_MESSAGES = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};
exports.RESPONSE_MESSAGES = {
    SUCCESS: '操作成功',
    CREATED: '创建成功',
    UPDATED: '更新成功',
    DELETED: '删除成功',
    NOT_FOUND: '资源不存在',
    UNAUTHORIZED: '未授权访问',
    FORBIDDEN: '禁止访问',
    BAD_REQUEST: '请求参数错误',
    INTERNAL_ERROR: '服务器内部错误',
    VALIDATION_ERROR: '数据验证失败',
    DUPLICATE_ERROR: '数据已存在',
    RATE_LIMIT_EXCEEDED: '请求频率超限',
    FILE_UPLOAD_ERROR: '文件上传失败',
    FILE_NOT_FOUND: '文件不存在',
    INVALID_TOKEN: '无效的令牌',
    TOKEN_EXPIRED: '令牌已过期',
    INSUFFICIENT_PERMISSIONS: '权限不足'
};
exports.USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    OPERATOR: 'operator',
    VIEWER: 'viewer',
    USER: 'user'
};
exports.USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending'
};
exports.DISASTER_TYPES = {
    FLOOD: 'flood',
    EARTHQUAKE: 'earthquake',
    TYPHOON: 'typhoon',
    FIRE: 'fire',
    LANDSLIDE: 'landslide',
    DROUGHT: 'drought',
    STORM: 'storm',
    TSUNAMI: 'tsunami',
    VOLCANIC: 'volcanic',
    OTHER: 'other'
};
exports.RISK_LEVELS = {
    VERY_LOW: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
    VERY_HIGH: 5,
    EXTREME: 6
};
exports.RISK_LEVEL_LABELS = {
    [exports.RISK_LEVELS.VERY_LOW]: '极低',
    [exports.RISK_LEVELS.LOW]: '低',
    [exports.RISK_LEVELS.MEDIUM]: '中',
    [exports.RISK_LEVELS.HIGH]: '高',
    [exports.RISK_LEVELS.VERY_HIGH]: '极高',
    [exports.RISK_LEVELS.EXTREME]: '极端'
};
exports.RISK_LEVEL_COLORS = {
    [exports.RISK_LEVELS.VERY_LOW]: '#00FF00',
    [exports.RISK_LEVELS.LOW]: '#FFFF00',
    [exports.RISK_LEVELS.MEDIUM]: '#FFA500',
    [exports.RISK_LEVELS.HIGH]: '#FF4500',
    [exports.RISK_LEVELS.VERY_HIGH]: '#FF0000',
    [exports.RISK_LEVELS.EXTREME]: '#8B0000'
};
exports.WARNING_LEVELS = {
    BLUE: 'blue',
    YELLOW: 'yellow',
    ORANGE: 'orange',
    RED: 'red'
};
exports.WARNING_LEVEL_LABELS = {
    [exports.WARNING_LEVELS.BLUE]: '蓝色预警',
    [exports.WARNING_LEVELS.YELLOW]: '黄色预警',
    [exports.WARNING_LEVELS.ORANGE]: '橙色预警',
    [exports.WARNING_LEVELS.RED]: '红色预警'
};
exports.WARNING_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};
exports.STATION_STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    MAINTENANCE: 'maintenance',
    ERROR: 'error'
};
exports.MONITORING_DATA_TYPES = {
    TEMPERATURE: 'temperature',
    HUMIDITY: 'humidity',
    PRESSURE: 'pressure',
    WIND_SPEED: 'wind_speed',
    WIND_DIRECTION: 'wind_direction',
    RAINFALL: 'rainfall',
    WATER_LEVEL: 'water_level',
    SOIL_MOISTURE: 'soil_moisture',
    SEISMIC_ACTIVITY: 'seismic_activity',
    AIR_QUALITY: 'air_quality'
};
exports.FILE_TYPES = {
    IMAGE: 'image',
    DOCUMENT: 'document',
    VIDEO: 'video',
    AUDIO: 'audio',
    ARCHIVE: 'archive',
    DATA: 'data',
    OTHER: 'other'
};
exports.FILE_STATUS = {
    UPLOADING: 'uploading',
    UPLOADED: 'uploaded',
    PROCESSING: 'processing',
    PROCESSED: 'processed',
    ERROR: 'error',
    DELETED: 'deleted'
};
exports.ROUTE_STATUS = {
    AVAILABLE: 'available',
    BLOCKED: 'blocked',
    RESTRICTED: 'restricted',
    UNDER_CONSTRUCTION: 'under_construction',
    DAMAGED: 'damaged'
};
exports.SHELTER_STATUS = {
    AVAILABLE: 'available',
    FULL: 'full',
    CLOSED: 'closed',
    DAMAGED: 'damaged',
    MAINTENANCE: 'maintenance'
};
exports.SHELTER_TYPES = {
    SCHOOL: 'school',
    COMMUNITY_CENTER: 'community_center',
    SPORTS_FACILITY: 'sports_facility',
    GOVERNMENT_BUILDING: 'government_building',
    RELIGIOUS_FACILITY: 'religious_facility',
    TEMPORARY: 'temporary',
    OTHER: 'other'
};
exports.REPORT_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    INVESTIGATING: 'investigating',
    RESOLVED: 'resolved',
    REJECTED: 'rejected'
};
exports.VERIFICATION_STATUSES = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
};
exports.VERIFICATION_STATUS_LABELS = {
    [exports.VERIFICATION_STATUSES.PENDING]: '待验证',
    [exports.VERIFICATION_STATUSES.VERIFIED]: '已验证',
    [exports.VERIFICATION_STATUSES.REJECTED]: '已拒绝'
};
exports.SEVERITY_LEVELS = [1, 2, 3, 4, 5];
exports.SEVERITY_LEVEL_LABELS = {
    1: '轻微',
    2: '一般',
    3: '严重',
    4: '很严重',
    5: '极严重'
};
exports.REPORT_TYPES = {
    DISASTER: 'disaster',
    INFRASTRUCTURE: 'infrastructure',
    SAFETY: 'safety',
    ENVIRONMENTAL: 'environmental',
    OTHER: 'other'
};
exports.REPORT_TYPE_LABELS = {
    [exports.REPORT_TYPES.DISASTER]: '灾害报告',
    [exports.REPORT_TYPES.INFRASTRUCTURE]: '基础设施',
    [exports.REPORT_TYPES.SAFETY]: '安全',
    [exports.REPORT_TYPES.ENVIRONMENTAL]: '环境',
    [exports.REPORT_TYPES.OTHER]: '其他'
};
exports.REPORT_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};
exports.CONFIG_TYPES = {
    SYSTEM: 'system',
    NOTIFICATION: 'notification',
    SECURITY: 'security',
    MONITORING: 'monitoring',
    ALERT: 'alert',
    INTEGRATION: 'integration'
};
exports.NOTIFICATION_TYPES = {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    WEBHOOK: 'webhook',
    SYSTEM: 'system'
};
exports.NOTIFICATION_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
exports.LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    HTTP: 'http',
    DEBUG: 'debug'
};
exports.OPERATION_TYPES = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    EXPORT: 'export',
    IMPORT: 'import'
};
exports.TABLE_NAMES = {
    USERS: 'users',
    DISASTER_TYPES: 'disaster_types',
    RISK_ZONES: 'risk_zones',
    RISK_ASSESSMENTS: 'risk_assessments',
    MONITORING_STATIONS: 'monitoring_stations',
    MONITORING_DATA: 'monitoring_data',
    WARNINGS: 'warnings',
    SHELTERS: 'shelters',
    ESCAPE_ROUTES: 'escape_routes',
    ROAD_NETWORKS: 'road_networks',
    USER_REPORTS: 'user_reports',
    FILES: 'files',
    SYSTEM_CONFIGS: 'system_configs',
    REFRESH_TOKENS: 'refresh_tokens',
    PASSWORD_RESET_TOKENS: 'password_reset_tokens'
};
exports.CACHE_KEYS = {
    USER: 'user:',
    SESSION: 'session:',
    RATE_LIMIT: 'rate_limit:',
    CONFIG: 'config:',
    MONITORING: 'monitoring:',
    WARNING: 'warning:',
    ROUTE: 'route:',
    SHELTER: 'shelter:'
};
exports.CACHE_TTL = {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 86400,
    SESSION: 7200,
    CONFIG: 3600,
    MONITORING: 300,
    WARNING: 600
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1
};
exports.COORDINATE_SYSTEMS = {
    WGS84: 'WGS84',
    GCJ02: 'GCJ02',
    BD09: 'BD09'
};
exports.GEOMETRY_TYPES = {
    POINT: 'Point',
    LINE_STRING: 'LineString',
    POLYGON: 'Polygon',
    MULTI_POINT: 'MultiPoint',
    MULTI_LINE_STRING: 'MultiLineString',
    MULTI_POLYGON: 'MultiPolygon'
};
exports.UNITS = {
    DISTANCE: {
        METER: 'm',
        KILOMETER: 'km',
        MILE: 'mi',
        FOOT: 'ft'
    },
    TEMPERATURE: {
        CELSIUS: '°C',
        FAHRENHEIT: '°F',
        KELVIN: 'K'
    },
    PRESSURE: {
        PASCAL: 'Pa',
        HECTOPASCAL: 'hPa',
        MILLIBAR: 'mbar',
        ATMOSPHERE: 'atm'
    },
    SPEED: {
        METER_PER_SECOND: 'm/s',
        KILOMETER_PER_HOUR: 'km/h',
        MILE_PER_HOUR: 'mph',
        KNOT: 'kn'
    }
};
exports.TIME_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DATE_ONLY: 'YYYY-MM-DD',
    TIME_ONLY: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    CHINESE_DATE: 'YYYY年MM月DD日',
    CHINESE_DATETIME: 'YYYY年MM月DD日 HH:mm:ss'
};
exports.REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^1[3-9]\d{9}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    CHINESE_NAME: /^[\u4e00-\u9fa5]{2,10}$/,
    ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
    COORDINATE: /^-?\d+(\.\d+)?$/,
    IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    DUPLICATE_ERROR: 'DUPLICATE_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    FILE_ERROR: 'FILE_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};
exports.ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    TESTING: 'testing',
    STAGING: 'staging',
    PRODUCTION: 'production'
};
exports.API_VERSIONS = {
    V1: 'v1',
    V2: 'v2'
};
exports.DEFAULTS = {
    LANGUAGE: 'zh-CN',
    TIMEZONE: 'Asia/Shanghai',
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    SESSION_TIMEOUT: 7200,
    TOKEN_EXPIRY: 86400,
    REFRESH_TOKEN_EXPIRY: 604800,
    PASSWORD_RESET_EXPIRY: 3600,
    VERIFICATION_CODE_EXPIRY: 300,
    FILE_UPLOAD_MAX_SIZE: 10 * 1024 * 1024,
    RATE_LIMIT_WINDOW: 900,
    RATE_LIMIT_MAX_REQUESTS: 100
};
//# sourceMappingURL=constants.js.map