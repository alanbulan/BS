declare class CacheService {
    private readonly CACHE_PREFIX;
    private readonly SYSTEM_CONFIG_PREFIX;
    private readonly DEFAULT_EXPIRE_TIME;
    private generateKey;
    setSystemConfig(key: string, value: any, expireInSeconds?: number): Promise<void>;
    getSystemConfig(key: string): Promise<any | null>;
    deleteSystemConfig(key: string): Promise<void>;
    clearSystemConfigCache(): Promise<void>;
    clearAllCache(): Promise<void>;
    set(type: string, key: string, value: any, expireInSeconds?: number): Promise<void>;
    get(type: string, key: string): Promise<any | null>;
    delete(type: string, key: string): Promise<void>;
    isConnected(): boolean;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=CacheService.d.ts.map