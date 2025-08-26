"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = exports.ConfigService = void 0;
const SystemConfigModel_1 = require("../models/SystemConfigModel");
const events_1 = require("events");
class ConfigService extends events_1.EventEmitter {
    constructor() {
        super();
        this.cache = {};
        this.DEFAULT_TTL = 5 * 60 * 1000;
        this.DEFAULT_VALUES = {
            'monitoring.collection_interval': 30,
            'risk.high_risk_threshold': 0.7,
            'risk.assessment_interval_hours': 6,
            'warning.auto_send': true,
            'notification.email_enabled': false,
            'system.name': '地质灾害风险监测系统',
            'emergency_contacts': [],
            'map_default_center': { lat: 39.9042, lng: 116.4074 }
        };
        this.systemConfigModel = new SystemConfigModel_1.SystemConfigModel();
    }
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    async getConfig(key) {
        try {
            const cached = this.getCachedValue(key);
            if (cached !== null) {
                return cached;
            }
            const dbValue = await this.systemConfigModel.getValue(key);
            let parsedValue;
            if (dbValue !== null) {
                try {
                    parsedValue = JSON.parse(dbValue);
                }
                catch {
                    parsedValue = dbValue;
                }
            }
            else {
                parsedValue = this.DEFAULT_VALUES[key];
                console.warn(`配置项 ${key} 不存在，使用默认值:`, parsedValue);
            }
            const typedValue = this.convertAndValidateValue(key, parsedValue);
            this.setCachedValue(key, typedValue);
            return typedValue;
        }
        catch (error) {
            console.error(`获取配置 ${key} 失败:`, error);
            const defaultValue = this.DEFAULT_VALUES[key];
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw error;
        }
    }
    async setConfig(key, value) {
        try {
            const validatedValue = this.convertAndValidateValue(key, value);
            const stringValue = typeof validatedValue === 'string'
                ? validatedValue
                : JSON.stringify(validatedValue);
            await this.systemConfigModel.setValue(key, stringValue);
            this.setCachedValue(key, validatedValue);
            this.emit('configChanged', key, validatedValue);
            console.log(`配置 ${key} 已更新为:`, validatedValue);
        }
        catch (error) {
            console.error(`设置配置 ${key} 失败:`, error);
            throw error;
        }
    }
    async getConfigs(keys) {
        const result = {};
        await Promise.all(keys.map(async (key) => {
            result[key] = await this.getConfig(key);
        }));
        return result;
    }
    clearCache(key) {
        if (key) {
            delete this.cache[key];
            console.log(`已清除配置 ${key} 的缓存`);
        }
        else {
            this.cache = {};
            console.log('已清除所有配置缓存');
        }
    }
    async warmupCache() {
        const commonConfigs = [
            'monitoring.collection_interval',
            'risk.high_risk_threshold',
            'warning.auto_send',
            'notification.email_enabled'
        ];
        console.log('开始预热配置缓存...');
        await this.getConfigs(commonConfigs);
        console.log('配置缓存预热完成');
    }
    getCachedValue(key) {
        const cached = this.cache[key];
        if (!cached) {
            return null;
        }
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            delete this.cache[key];
            return null;
        }
        return cached.value;
    }
    setCachedValue(key, value, ttl = this.DEFAULT_TTL) {
        this.cache[key] = {
            value,
            timestamp: Date.now(),
            ttl
        };
    }
    convertAndValidateValue(key, value) {
        try {
            switch (key) {
                case 'monitoring.collection_interval':
                    const intervalValue = Number(value);
                    if (isNaN(intervalValue) || intervalValue <= 0) {
                        throw new Error(`监控数据收集间隔必须是正数（分钟）`);
                    }
                    if (intervalValue > 1440) {
                        throw new Error(`监控数据收集间隔不能超过1440分钟（24小时）`);
                    }
                    return intervalValue;
                case 'risk.assessment_interval_hours':
                    const assessmentValue = Number(value);
                    if (isNaN(assessmentValue) || assessmentValue <= 0) {
                        throw new Error(`风险评估间隔必须是正数（小时）`);
                    }
                    if (assessmentValue > 168) {
                        throw new Error(`风险评估间隔不能超过168小时（7天）`);
                    }
                    return assessmentValue;
                case 'risk.high_risk_threshold':
                    const thresholdValue = Number(value);
                    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 1) {
                        throw new Error(`高风险阈值必须是0-1之间的数值`);
                    }
                    return thresholdValue;
                case 'warning.auto_send':
                case 'notification.email_enabled':
                    if (typeof value === 'string') {
                        const lowerValue = value.toLowerCase();
                        if (lowerValue !== 'true' && lowerValue !== 'false') {
                            throw new Error(`${key} 必须是布尔值或'true'/'false'字符串`);
                        }
                        return (lowerValue === 'true');
                    }
                    if (typeof value !== 'boolean') {
                        throw new Error(`${key} 必须是布尔值`);
                    }
                    return Boolean(value);
                case 'system.name':
                    if (typeof value !== 'string') {
                        throw new Error(`系统名称必须是字符串`);
                    }
                    const trimmedName = value.trim();
                    if (trimmedName.length === 0) {
                        throw new Error(`系统名称不能为空`);
                    }
                    if (trimmedName.length > 100) {
                        throw new Error(`系统名称长度不能超过100个字符`);
                    }
                    return trimmedName;
                case 'emergency_contacts':
                    if (!Array.isArray(value)) {
                        throw new Error(`紧急联系人必须是数组`);
                    }
                    for (let i = 0; i < value.length; i++) {
                        const contact = value[i];
                        if (typeof contact !== 'object' || !contact.name || !contact.phone) {
                            throw new Error(`紧急联系人[${i}]必须包含name和phone属性`);
                        }
                        if (typeof contact.name !== 'string' || contact.name.trim().length === 0) {
                            throw new Error(`紧急联系人[${i}]的姓名必须是非空字符串`);
                        }
                        if (typeof contact.phone !== 'string' || !/^[\d\-\+\(\)\s]+$/.test(contact.phone)) {
                            throw new Error(`紧急联系人[${i}]的电话号码格式不正确`);
                        }
                    }
                    return value;
                case 'map_default_center':
                    if (typeof value !== 'object' || value === null) {
                        throw new Error(`地图默认中心必须是对象`);
                    }
                    if (!('lat' in value) || !('lng' in value)) {
                        throw new Error(`地图默认中心必须包含lat和lng属性`);
                    }
                    const lat = Number(value.lat);
                    const lng = Number(value.lng);
                    if (isNaN(lat) || isNaN(lng)) {
                        throw new Error(`地图默认中心的lat和lng必须是数值`);
                    }
                    if (lat < -90 || lat > 90) {
                        throw new Error(`纬度必须在-90到90之间`);
                    }
                    if (lng < -180 || lng > 180) {
                        throw new Error(`经度必须在-180到180之间`);
                    }
                    return { lat, lng };
                default:
                    console.warn(`未知的配置项: ${key}，跳过验证`);
                    return value;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`配置验证失败 [${key}]:`, errorMessage);
            throw new Error(`配置项 ${key} 验证失败: ${errorMessage}`);
        }
    }
    getCacheStats() {
        const totalCached = Object.keys(this.cache).length;
        return {
            totalCached,
            cacheHitRate: 0
        };
    }
}
exports.ConfigService = ConfigService;
exports.configService = ConfigService.getInstance();
//# sourceMappingURL=ConfigService.js.map