import { EventEmitter } from 'events';
export interface ConfigCache {
    [key: string]: {
        value: any;
        timestamp: number;
        ttl: number;
    };
}
export interface SystemConfigs {
    'monitoring.collection_interval': number;
    'risk.high_risk_threshold': number;
    'risk.assessment_interval_hours': number;
    'warning.auto_send': boolean;
    'notification.email_enabled': boolean;
    'system.name': string;
    'emergency_contacts': any[];
    'map_default_center': {
        lat: number;
        lng: number;
    };
}
export declare class ConfigService extends EventEmitter {
    private static instance;
    private systemConfigModel;
    private cache;
    private readonly DEFAULT_TTL;
    private readonly DEFAULT_VALUES;
    private constructor();
    static getInstance(): ConfigService;
    getConfig<K extends keyof SystemConfigs>(key: K): Promise<SystemConfigs[K]>;
    setConfig<K extends keyof SystemConfigs>(key: K, value: SystemConfigs[K]): Promise<void>;
    getConfigs<K extends keyof SystemConfigs>(keys: K[]): Promise<Pick<SystemConfigs, K>>;
    clearCache(key?: keyof SystemConfigs): void;
    warmupCache(): Promise<void>;
    private getCachedValue;
    private setCachedValue;
    private convertAndValidateValue;
    getCacheStats(): {
        totalCached: number;
        cacheHitRate: number;
    };
}
export declare const configService: ConfigService;
//# sourceMappingURL=ConfigService.d.ts.map