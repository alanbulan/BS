// 系统常量定义

// HTTP状态码
export const HTTP_STATUS = {
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
} as const;

// 响应消息
export const RESPONSE_MESSAGES = {
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
} as const;

// 用户角色
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  USER: 'user'
} as const;

// 用户状态
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const;

// 灾害类型
export const DISASTER_TYPES = {
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
} as const;

// 风险等级
export const RISK_LEVELS = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5,
  EXTREME: 6
} as const;

// 风险等级标签
export const RISK_LEVEL_LABELS = {
  [RISK_LEVELS.VERY_LOW]: '极低',
  [RISK_LEVELS.LOW]: '低',
  [RISK_LEVELS.MEDIUM]: '中',
  [RISK_LEVELS.HIGH]: '高',
  [RISK_LEVELS.VERY_HIGH]: '极高',
  [RISK_LEVELS.EXTREME]: '极端'
} as const;

// 风险等级颜色
export const RISK_LEVEL_COLORS = {
  [RISK_LEVELS.VERY_LOW]: '#00FF00',
  [RISK_LEVELS.LOW]: '#FFFF00',
  [RISK_LEVELS.MEDIUM]: '#FFA500',
  [RISK_LEVELS.HIGH]: '#FF4500',
  [RISK_LEVELS.VERY_HIGH]: '#FF0000',
  [RISK_LEVELS.EXTREME]: '#8B0000'
} as const;

// 预警等级
export const WARNING_LEVELS = {
  BLUE: 'blue',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  RED: 'red'
} as const;

// 预警等级标签
export const WARNING_LEVEL_LABELS = {
  [WARNING_LEVELS.BLUE]: '蓝色预警',
  [WARNING_LEVELS.YELLOW]: '黄色预警',
  [WARNING_LEVELS.ORANGE]: '橙色预警',
  [WARNING_LEVELS.RED]: '红色预警'
} as const;

// 预警状态
export const WARNING_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const;

// 监测站状态
export const STATION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  ERROR: 'error'
} as const;

// 监测数据类型
export const MONITORING_DATA_TYPES = {
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
} as const;

// 文件类型
export const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  DATA: 'data',
  OTHER: 'other'
} as const;

// 文件状态
export const FILE_STATUS = {
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  ERROR: 'error',
  DELETED: 'deleted'
} as const;

// 路线状态
export const ROUTE_STATUS = {
  AVAILABLE: 'available',
  BLOCKED: 'blocked',
  RESTRICTED: 'restricted',
  UNDER_CONSTRUCTION: 'under_construction',
  DAMAGED: 'damaged'
} as const;

// 避难所状态
export const SHELTER_STATUS = {
  AVAILABLE: 'available',
  FULL: 'full',
  CLOSED: 'closed',
  DAMAGED: 'damaged',
  MAINTENANCE: 'maintenance'
} as const;

// 避难所类型
export const SHELTER_TYPES = {
  SCHOOL: 'school',
  COMMUNITY_CENTER: 'community_center',
  SPORTS_FACILITY: 'sports_facility',
  GOVERNMENT_BUILDING: 'government_building',
  RELIGIOUS_FACILITY: 'religious_facility',
  TEMPORARY: 'temporary',
  OTHER: 'other'
} as const;

// 报告状态
export const REPORT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
} as const;

// 报告类型
export const REPORT_TYPES = {
  DISASTER: 'disaster',
  INFRASTRUCTURE: 'infrastructure',
  SAFETY: 'safety',
  ENVIRONMENTAL: 'environmental',
  OTHER: 'other'
} as const;

// 报告优先级
export const REPORT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// 系统配置类型
export const CONFIG_TYPES = {
  SYSTEM: 'system',
  NOTIFICATION: 'notification',
  SECURITY: 'security',
  MONITORING: 'monitoring',
  ALERT: 'alert',
  INTEGRATION: 'integration'
} as const;

// 通知类型
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook',
  SYSTEM: 'system'
} as const;

// 通知状态
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

// 日志级别
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug'
} as const;

// 操作类型
export const OPERATION_TYPES = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import'
} as const;

// 数据库表名
export const TABLE_NAMES = {
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
} as const;

// 缓存键前缀
export const CACHE_KEYS = {
  USER: 'user:',
  SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
  CONFIG: 'config:',
  MONITORING: 'monitoring:',
  WARNING: 'warning:',
  ROUTE: 'route:',
  SHELTER: 'shelter:'
} as const;

// 缓存过期时间（秒）
export const CACHE_TTL = {
  SHORT: 300, // 5分钟
  MEDIUM: 1800, // 30分钟
  LONG: 3600, // 1小时
  VERY_LONG: 86400, // 24小时
  SESSION: 7200, // 2小时
  CONFIG: 3600, // 1小时
  MONITORING: 300, // 5分钟
  WARNING: 600 // 10分钟
} as const;

// 分页默认值
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
} as const;

// 坐标系统
export const COORDINATE_SYSTEMS = {
  WGS84: 'WGS84',
  GCJ02: 'GCJ02',
  BD09: 'BD09'
} as const;

// 地理数据类型
export const GEOMETRY_TYPES = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
} as const;

// 单位
export const UNITS = {
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
} as const;

// 时间格式
export const TIME_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  CHINESE_DATE: 'YYYY年MM月DD日',
  CHINESE_DATETIME: 'YYYY年MM月DD日 HH:mm:ss'
} as const;

// 正则表达式
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  CHINESE_NAME: /^[\u4e00-\u9fa5]{2,10}$/,
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  COORDINATE: /^-?\d+(\.\d+)?$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
} as const;

// 错误代码
export const ERROR_CODES = {
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
} as const;

// 环境变量
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production'
} as const;

// API版本
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2'
} as const;

// 默认值
export const DEFAULTS = {
  LANGUAGE: 'zh-CN',
  TIMEZONE: 'Asia/Shanghai',
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SESSION_TIMEOUT: 7200, // 2小时
  TOKEN_EXPIRY: 86400, // 24小时
  REFRESH_TOKEN_EXPIRY: 604800, // 7天
  PASSWORD_RESET_EXPIRY: 3600, // 1小时
  VERIFICATION_CODE_EXPIRY: 300, // 5分钟
  FILE_UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT_WINDOW: 900, // 15分钟
  RATE_LIMIT_MAX_REQUESTS: 100
} as const;