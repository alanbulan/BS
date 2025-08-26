import { BaseModel } from './BaseModel';
import { MonitoringStation } from '../types';
export interface CreateMonitoringStationData {
    station_id: string;
    name: string;
    location: any;
    station_type: string;
    monitoring_type?: string;
    address?: string;
    elevation?: number;
    equipment_info?: any;
    installation_date?: Date;
    installation_status?: string;
    maintenance_schedule?: any;
    data_transmission_interval?: number;
    power_source?: string;
    communication_method?: string;
    contact_info?: any;
    technical_specs?: any;
    is_active?: boolean;
    zone_id?: number;
    [key: string]: any;
}
export interface UpdateMonitoringStationData {
    station_id?: string;
    name?: string;
    location?: any;
    station_type?: string;
    monitoring_type?: string;
    address?: string;
    elevation?: number;
    equipment_info?: any;
    installation_date?: Date;
    installation_status?: string;
    maintenance_schedule?: any;
    data_transmission_interval?: number;
    power_source?: string;
    communication_method?: string;
    contact_info?: any;
    technical_specs?: any;
    is_active?: boolean;
    zone_id?: number;
    last_maintenance_date?: Date;
    next_maintenance_date?: Date;
    [key: string]: any;
}
export declare class MonitoringStationModel extends BaseModel {
    constructor();
    paginate(page: number, limit: number, conditions?: any, sortBy?: string, sortOrder?: string): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findByStationId(stationId: string): Promise<MonitoringStation | null>;
    create(data: CreateMonitoringStationData): Promise<MonitoringStation>;
    update(id: number, data: UpdateMonitoringStationData): Promise<MonitoringStation | null>;
    delete(id: number): Promise<boolean>;
    getStationsByZone(zoneId: number): Promise<MonitoringStation[]>;
    batchUpdateStatus(stationIds: number[], updates: any): Promise<number>;
    getActiveStations(): Promise<MonitoringStation[]>;
    findById(id: number): Promise<MonitoringStation | null>;
    getStationStatistics(): Promise<any>;
    customQuery(sql: string, params?: any[]): Promise<any[]>;
}
//# sourceMappingURL=MonitoringStationModel.d.ts.map