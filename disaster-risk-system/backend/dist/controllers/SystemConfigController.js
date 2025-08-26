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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigController = void 0;
const BaseController_1 = require("./BaseController");
const SystemConfigModel_1 = require("../models/SystemConfigModel");
const asyncHandler_1 = require("../middleware/asyncHandler");
const ConfigService_1 = require("../services/ConfigService");
const database_1 = require("../config/database");
class SystemConfigController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.createConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { config_key, config_value, category, description, is_public } = req.body;
            if (!config_key || config_value === undefined || !category) {
                return this.error(res, '配置键、配置值和配置类型是必填的', 400);
            }
            const existing = await this.systemConfigModel.getByKey(config_key);
            if (existing) {
                return this.error(res, '配置键已存在', 409);
            }
            let processedValue = config_value;
            if (typeof config_value === 'string') {
                try {
                    processedValue = JSON.parse(config_value);
                }
                catch (e) {
                    processedValue = config_value;
                }
            }
            const configData = {
                config_key,
                config_value: processedValue,
                category,
                description,
                is_public
            };
            const config = await this.systemConfigModel.create(configData);
            this.created(res, config, '系统配置创建成功');
            return;
        });
        this.getConfigs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { category, is_public, search, page = 1, limit = 20 } = req.query;
            const conditions = {
                category: category,
                is_public: is_public !== undefined ? is_public === 'true' : undefined,
                search: search,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };
            const result = await this.systemConfigModel.findWithConditions(conditions);
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const totalPages = Math.ceil(result.total / limitNum);
            this.paginated(res, result.configs, {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                pages: totalPages
            });
        });
        this.getConfigByKey = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key } = req.params;
            const config = await this.systemConfigModel.getByKey(key);
            if (!config) {
                return this.notFound(res, '配置不存在');
            }
            this.success(res, config);
            return;
        });
        this.getConfigValue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key } = req.params;
            const { defaultValue } = req.query;
            const value = await this.systemConfigModel.getValue(key, defaultValue ? JSON.parse(defaultValue) : undefined);
            this.success(res, { value });
        });
        this.getConfigsByType = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { type } = req.params;
            const configs = await this.systemConfigModel.getByType(type);
            this.success(res, configs);
        });
        this.getWarningLevels = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const warningLevels = await this.systemConfigModel.getValue('warning.levels', []);
            this.success(res, warningLevels);
        });
        this.updateConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key } = req.params;
            const { config_value, category, description, is_public } = req.body;
            let processedValue = config_value;
            if (config_value !== undefined && typeof config_value === 'string') {
                try {
                    processedValue = JSON.parse(config_value);
                }
                catch (e) {
                    processedValue = config_value;
                }
            }
            const updateData = {
                config_value: processedValue,
                category,
                description,
                is_public
            };
            const config = await this.systemConfigModel.updateByKey(key, updateData);
            if (!config) {
                return this.notFound(res, '配置不存在');
            }
            if (config_value !== undefined) {
                try {
                    await ConfigService_1.configService.setConfig(key, processedValue);
                    console.log(`配置 ${key} 热更新成功`);
                }
                catch (error) {
                    console.warn(`配置 ${key} 热更新失败:`, error);
                }
            }
            this.success(res, config, '系统配置更新成功');
            return;
        });
        this.setConfigValue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key } = req.params;
            const { value, category = 'general' } = req.body;
            if (value === undefined) {
                return this.error(res, '配置值是必填的', 400);
            }
            let processedValue = value;
            if (typeof value === 'string') {
                try {
                    processedValue = JSON.parse(value);
                }
                catch (e) {
                    processedValue = value;
                }
            }
            const config = await this.systemConfigModel.setValue(key, processedValue, category);
            try {
                await ConfigService_1.configService.setConfig(key, processedValue);
                console.log(`配置 ${key} 热更新成功`);
            }
            catch (error) {
                console.warn(`配置 ${key} 热更新失败:`, error);
            }
            this.success(res, config, '配置值设置成功');
            return;
        });
        this.setBatchConfigs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { configs } = req.body;
            if (!Array.isArray(configs) || configs.length === 0) {
                return this.error(res, '配置数据不能为空', 400);
            }
            const processedConfigs = [];
            for (const config of configs) {
                if (!config.key || config.value === undefined) {
                    return this.error(res, '每个配置必须包含key和value', 400);
                }
                let processedValue = config.value;
                if (typeof config.value === 'string') {
                    try {
                        processedValue = JSON.parse(config.value);
                    }
                    catch (e) {
                        processedValue = config.value;
                    }
                }
                processedConfigs.push({
                    ...config,
                    value: processedValue
                });
            }
            const results = await this.systemConfigModel.setBatch(processedConfigs);
            for (const config of processedConfigs) {
                try {
                    await ConfigService_1.configService.setConfig(config.key, config.value);
                    console.log(`批量配置 ${config.key} 热更新成功`);
                }
                catch (error) {
                    console.warn(`批量配置 ${config.key} 热更新失败:`, error);
                }
            }
            this.success(res, results, `成功设置 ${results.length} 个配置`);
            return;
        });
        this.deleteConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key } = req.params;
            const success = await this.systemConfigModel.deleteByKey(key);
            if (!success) {
                return this.notFound(res, '配置不存在');
            }
            this.success(res, null, '系统配置删除成功');
            return;
        });
        this.hardDeleteConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key } = req.params;
            const success = await this.systemConfigModel.hardDeleteByKey(key);
            if (!success) {
                return this.notFound(res, '配置不存在');
            }
            this.success(res, null, '系统配置永久删除成功');
            return;
        });
        this.getConfigTypes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const types = await this.systemConfigModel.getConfigTypes();
            this.success(res, types);
        });
        this.getStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await this.systemConfigModel.getStatistics();
            this.success(res, statistics);
        });
        this.exportConfigs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { type } = req.query;
            const configs = await this.systemConfigModel.exportConfigs(type);
            const filename = type ? `config_${type}_${Date.now()}.json` : `config_all_${Date.now()}.json`;
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.setHeader('Content-Type', 'application/json');
            this.success(res, configs);
        });
        this.importConfigs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { configs, overwrite = false } = req.body;
            if (!Array.isArray(configs) || configs.length === 0) {
                return this.error(res, '配置数据不能为空', 400);
            }
            for (const config of configs) {
                if (!config.config_key || config.config_value === undefined || !config.category) {
                    return this.error(res, '每个配置必须包含config_key、config_value和category', 400);
                }
            }
            const result = await this.systemConfigModel.importConfigs(configs, overwrite);
            this.success(res, result, `导入完成：创建 ${result.created} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个`);
            return;
        });
        this.resetToDefaults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { type } = req.body;
            const defaultConfigs = [
                {
                    config_key: 'system.name',
                    config_value: '地质灾害风险评估系统',
                    category: 'system',
                    description: '系统名称'
                },
                {
                    config_key: 'system.version',
                    config_value: '1.0.0',
                    category: 'system',
                    description: '系统版本'
                },
                {
                    config_key: 'warning.default_radius',
                    config_value: 5000,
                    category: 'warning',
                    description: '默认预警半径（米）'
                },
                {
                    config_key: 'warning.auto_send',
                    config_value: true,
                    category: 'warning',
                    description: '是否自动发送预警'
                },
                {
                    config_key: 'monitoring.data_retention_days',
                    config_value: 365,
                    category: 'monitoring',
                    description: '监测数据保留天数'
                },
                {
                    config_key: 'monitoring.collection_interval',
                    config_value: 300,
                    category: 'monitoring',
                    description: '数据采集间隔（秒）'
                },
                {
                    config_key: 'risk.assessment_interval_hours',
                    config_value: 6,
                    category: 'risk',
                    description: '风险评估间隔（小时）'
                },
                {
                    config_key: 'risk.high_risk_threshold',
                    config_value: 0.8,
                    category: 'risk',
                    description: '高风险阈值'
                },
                {
                    config_key: 'notification.email_enabled',
                    config_value: true,
                    category: 'notification',
                    description: '是否启用邮件通知'
                },
                {
                    config_key: 'notification.sms_enabled',
                    config_value: false,
                    category: 'notification',
                    description: '是否启用短信通知'
                }
            ];
            const configsToReset = type
                ? defaultConfigs.filter(config => config.category === type)
                : defaultConfigs;
            const result = await this.systemConfigModel.importConfigs(configsToReset, true);
            this.success(res, result, `重置完成：创建 ${result.created} 个，更新 ${result.updated} 个配置`);
        });
        this.clearCache = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const cacheService = (await Promise.resolve().then(() => __importStar(require('../services/CacheService')))).default;
                await cacheService.clearSystemConfigCache();
                console.log('System config cache cleared successfully');
                this.success(res, null, '缓存清除成功');
            }
            catch (error) {
                console.error('Clear cache error:', error);
                this.error(res, '清除缓存失败', 500);
            }
        });
        this.validateConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { key, value, type } = req.body;
            if (!key || value === undefined || !type) {
                return this.error(res, '配置键、值和类型是必填的', 400);
            }
            const validation = {
                valid: true,
                errors: []
            };
            switch (type) {
                case 'number':
                    if (typeof value !== 'number' && isNaN(Number(value))) {
                        validation.valid = false;
                        validation.errors.push('值必须是数字');
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean' && !['true', 'false'].includes(String(value).toLowerCase())) {
                        validation.valid = false;
                        validation.errors.push('值必须是布尔值');
                    }
                    break;
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(String(value))) {
                        validation.valid = false;
                        validation.errors.push('值必须是有效的邮箱地址');
                    }
                    break;
                case 'url':
                    try {
                        new URL(String(value));
                    }
                    catch {
                        validation.valid = false;
                        validation.errors.push('值必须是有效的URL');
                    }
                    break;
                case 'json':
                    try {
                        JSON.parse(String(value));
                    }
                    catch {
                        validation.valid = false;
                        validation.errors.push('值必须是有效的JSON');
                    }
                    break;
            }
            if (key.includes('threshold') && typeof value === 'number') {
                if (value < 0 || value > 1) {
                    validation.valid = false;
                    validation.errors.push('阈值必须在0-1之间');
                }
            }
            if (key.includes('interval') && typeof value === 'number') {
                if (value <= 0) {
                    validation.valid = false;
                    validation.errors.push('间隔值必须大于0');
                }
            }
            this.success(res, validation);
            return;
        });
        this.getSystemInfo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const dbVersionResult = await database_1.pool.query('SELECT version()');
                const dbVersionFull = dbVersionResult.rows[0].version;
                const versionMatch = dbVersionFull.match(/PostgreSQL ([\d\.]+)/);
                const dbVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : 'PostgreSQL Unknown';
                const uptimeResult = await database_1.pool.query('SELECT pg_postmaster_start_time()');
                const startTime = new Date(uptimeResult.rows[0].pg_postmaster_start_time);
                const uptime = this.formatUptime(Date.now() - startTime.getTime());
                const dbSizeResult = await database_1.pool.query("SELECT pg_size_pretty(pg_database_size('disaster_risk_db')) as size");
                const dbSize = dbSizeResult.rows[0].size;
                const systemStatus = await this.checkSystemStatus();
                const dbConnectionStatus = await this.checkDatabaseConnection();
                const systemInfo = {
                    version: 'v1.0.0',
                    dbVersion,
                    dbSize,
                    uptime,
                    lastBackup: '暂无备份',
                    environment: process.env.NODE_ENV || 'development',
                    nodeVersion: process.version,
                    systemStatus: systemStatus.status,
                    systemStatusText: systemStatus.text,
                    dbConnectionStatus: dbConnectionStatus.status,
                    dbConnectionText: dbConnectionStatus.text
                };
                this.success(res, systemInfo);
            }
            catch (error) {
                console.error('获取系统信息失败:', error);
                this.error(res, '获取系统信息失败', 500);
            }
        });
        this.systemConfigModel = new SystemConfigModel_1.SystemConfigModel();
    }
    async checkSystemStatus() {
        try {
            const memoryUsage = process.memoryUsage();
            const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            const isHealthy = memoryUsagePercent < 95;
            return {
                status: isHealthy ? 'normal' : 'warning',
                text: isHealthy ? '正常运行' : `运行异常 (内存使用率: ${memoryUsagePercent.toFixed(1)}%)`
            };
        }
        catch (error) {
            return {
                status: 'error',
                text: '状态检查失败'
            };
        }
    }
    async checkDatabaseConnection() {
        try {
            await database_1.pool.query('SELECT 1');
            return {
                status: 'connected',
                text: '已连接'
            };
        }
        catch (error) {
            return {
                status: 'disconnected',
                text: '连接失败'
            };
        }
    }
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}天${hours % 24}小时`;
        }
        else if (hours > 0) {
            return `${hours}小时${minutes % 60}分钟`;
        }
        else if (minutes > 0) {
            return `${minutes}分钟`;
        }
        else {
            return `${seconds}秒`;
        }
    }
}
exports.SystemConfigController = SystemConfigController;
//# sourceMappingURL=SystemConfigController.js.map