"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
class CacheService {
    constructor() {
        this.CACHE_PREFIX = 'disaster_risk:';
        this.SYSTEM_CONFIG_PREFIX = 'system_config:';
        this.DEFAULT_EXPIRE_TIME = 3600;
    }
    generateKey(type, key) {
        return `${this.CACHE_PREFIX}${type}${key}`;
    }
    async setSystemConfig(key, value, expireInSeconds) {
        try {
            const cacheKey = this.generateKey(this.SYSTEM_CONFIG_PREFIX, key);
            const cacheValue = JSON.stringify(value);
            await redis_1.default.set(cacheKey, cacheValue, expireInSeconds || this.DEFAULT_EXPIRE_TIME);
        }
        catch (error) {
            console.error('Failed to set system config cache:', error);
        }
    }
    async getSystemConfig(key) {
        try {
            const cacheKey = this.generateKey(this.SYSTEM_CONFIG_PREFIX, key);
            const cacheValue = await redis_1.default.get(cacheKey);
            return cacheValue ? JSON.parse(cacheValue) : null;
        }
        catch (error) {
            console.error('Failed to get system config cache:', error);
            return null;
        }
    }
    async deleteSystemConfig(key) {
        try {
            const cacheKey = this.generateKey(this.SYSTEM_CONFIG_PREFIX, key);
            await redis_1.default.del(cacheKey);
        }
        catch (error) {
            console.error('Failed to delete system config cache:', error);
        }
    }
    async clearSystemConfigCache() {
        try {
            const pattern = this.generateKey(this.SYSTEM_CONFIG_PREFIX, '*');
            const keys = await redis_1.default.keys(pattern);
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis_1.default.del(key);
                }
            }
        }
        catch (error) {
            console.error('Failed to clear system config cache:', error);
            throw error;
        }
    }
    async clearAllCache() {
        try {
            await redis_1.default.flushAll();
        }
        catch (error) {
            console.error('Failed to clear all cache:', error);
            throw error;
        }
    }
    async set(type, key, value, expireInSeconds) {
        try {
            const cacheKey = this.generateKey(type, key);
            const cacheValue = JSON.stringify(value);
            await redis_1.default.set(cacheKey, cacheValue, expireInSeconds || this.DEFAULT_EXPIRE_TIME);
        }
        catch (error) {
            console.error('Failed to set cache:', error);
        }
    }
    async get(type, key) {
        try {
            const cacheKey = this.generateKey(type, key);
            const cacheValue = await redis_1.default.get(cacheKey);
            return cacheValue ? JSON.parse(cacheValue) : null;
        }
        catch (error) {
            console.error('Failed to get cache:', error);
            return null;
        }
    }
    async delete(type, key) {
        try {
            const cacheKey = this.generateKey(type, key);
            await redis_1.default.del(cacheKey);
        }
        catch (error) {
            console.error('Failed to delete cache:', error);
        }
    }
    isConnected() {
        return redis_1.default.isClientConnected();
    }
}
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
//# sourceMappingURL=CacheService.js.map