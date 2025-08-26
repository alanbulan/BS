import { BaseModel } from './BaseModel';
export interface MonitoringStationType {
    id: number;
    code: string;
    name_zh: string;
    name_en: string;
    description_zh?: string | null;
    description_en?: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}
export interface CreateMonitoringStationTypeData {
    code: string;
    name_zh: string;
    name_en: string;
    description_zh?: string | null;
    description_en?: string | null;
    is_active?: boolean;
    sort_order?: number;
}
export interface UpdateMonitoringStationTypeData {
    code?: string;
    name_zh?: string;
    name_en?: string;
    description_zh?: string | null;
    description_en?: string | null;
    is_active?: boolean;
    sort_order?: number;
}
export declare class MonitoringStationTypeModel extends BaseModel {
    constructor();
    getActiveTypes(): Promise<MonitoringStationType[]>;
    findByCode(code: string): Promise<MonitoringStationType | null>;
    codeExists(code: string, excludeId?: number): Promise<boolean>;
    create(data: CreateMonitoringStationTypeData): Promise<MonitoringStationType>;
    update(id: number, data: UpdateMonitoringStationTypeData): Promise<MonitoringStationType | null>;
    delete(id: number): Promise<boolean>;
    validateStationType(code: string): Promise<boolean>;
    getTypeUsageStats(): Promise<{
        code: string;
        name_zh: string;
        name_en: string;
        station_count: number;
    }[]>;
}
//# sourceMappingURL=MonitoringStationTypeModel.d.ts.map