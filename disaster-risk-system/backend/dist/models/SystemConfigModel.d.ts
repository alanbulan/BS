import { BaseModel } from './BaseModel';
export interface SystemConfig {
    id: number;
    config_key: string;
    config_value: any;
    category: string;
    description?: string;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateSystemConfigData {
    config_key: string;
    config_value: any;
    category: string;
    description?: string;
    is_public?: boolean;
}
export interface UpdateSystemConfigData {
    config_value?: any;
    category?: string;
    description?: string;
    is_public?: boolean;
}
export interface SystemConfigQuery {
    category?: string;
    is_public?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}
export declare class SystemConfigModel extends BaseModel {
    constructor();
    create(data: CreateSystemConfigData): Promise<SystemConfig>;
    getByKey(configKey: string): Promise<SystemConfig | null>;
    getValue(configKey: string, defaultValue?: any): Promise<any>;
    findWithConditions(conditions: SystemConfigQuery): Promise<{
        configs: SystemConfig[];
        total: number;
    }>;
    getByType(configType: string): Promise<SystemConfig[]>;
    updateByKey(configKey: string, data: UpdateSystemConfigData): Promise<SystemConfig | null>;
    setValue(configKey: string, value: any, category?: string): Promise<SystemConfig>;
    setBatch(configs: Array<{
        key: string;
        value: any;
        category?: string;
        description?: string;
    }>): Promise<SystemConfig[]>;
    deleteByKey(configKey: string): Promise<boolean>;
    hardDeleteByKey(configKey: string): Promise<boolean>;
    getConfigTypes(): Promise<string[]>;
    getStatistics(): Promise<{
        total: number;
        active: number;
        byType: Record<string, number>;
    }>;
    exportConfigs(category?: string): Promise<SystemConfig[]>;
    importConfigs(configs: Array<{
        config_key: string;
        config_value: any;
        category: string;
        description?: string;
    }>, overwrite?: boolean): Promise<{
        created: number;
        updated: number;
        skipped: number;
    }>;
}
//# sourceMappingURL=SystemConfigModel.d.ts.map