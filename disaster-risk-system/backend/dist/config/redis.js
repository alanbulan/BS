"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = void 0;
const redis_1 = require("redis");
class RedisConfig {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }
    async connect() {
        if (this.isConnected && this.client) {
            return;
        }
        try {
            this.client = (0, redis_1.createClient)({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379')
                },
                password: process.env.REDIS_PASSWORD || undefined
            });
            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                console.log('Redis Client Connected');
                this.isConnected = true;
            });
            this.client.on('disconnect', () => {
                console.log('Redis Client Disconnected');
                this.isConnected = false;
            });
            await this.client.connect();
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }
    getClient() {
        return this.client;
    }
    isClientConnected() {
        return this.isConnected && this.client !== null;
    }
    async set(key, value, expireInSeconds) {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        if (expireInSeconds) {
            await this.client.setEx(key, expireInSeconds, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        return await this.client.get(key);
    }
    async del(key) {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        return await this.client.del(key);
    }
    async flushAll() {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        await this.client.flushAll();
    }
    async keys(pattern) {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        return await this.client.keys(pattern);
    }
}
exports.redisConfig = new RedisConfig();
exports.default = exports.redisConfig;
//# sourceMappingURL=redis.js.map