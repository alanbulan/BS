import { RedisClientType } from 'redis';
declare class RedisConfig {
    private client;
    private isConnected;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): RedisClientType | null;
    isClientConnected(): boolean;
    set(key: string, value: string, expireInSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    flushAll(): Promise<void>;
    keys(pattern: string): Promise<string[]>;
}
export declare const redisConfig: RedisConfig;
export default redisConfig;
//# sourceMappingURL=redis.d.ts.map