import { BaseModel } from './BaseModel';
import { MonitoringData, TimeRangeQuery } from '../types';
export declare class MonitoringDataModel extends BaseModel {
    constructor();
    create(data: Omit<MonitoringData, 'id' | 'created_at'>): Promise<MonitoringData>;
    batchCreate(dataArray: Omit<MonitoringData, 'id' | 'created_at'>[]): Promise<MonitoringData[]>;
    getLatestDataByStation(stationId: string, dataType?: string, limit?: number): Promise<MonitoringData[]>;
    getDataByTimeRange(stationId: string, dataType: string, timeRange: TimeRangeQuery, limit?: number): Promise<MonitoringData[]>;
    getDataStatistics(stationId: string, dataType: string, hours?: number): Promise<any>;
    getAnomalousData(stationId?: string, hours?: number): Promise<MonitoringData[]>;
    getDataTrend(stationId: string, dataType: string, hours?: number, interval?: string): Promise<any[]>;
    getMultiStationData(stationIds: string[], dataType: string, hours?: number): Promise<any[]>;
    deleteExpiredData(daysToKeep?: number): Promise<number>;
    getDataQualityReport(stationId?: string, hours?: number): Promise<any>;
    getRealTimeData(stationIds?: string[], dataTypes?: string[], limit?: number): Promise<MonitoringData[]>;
    getRecentData(limit?: number): Promise<MonitoringData[]>;
    findByTimeRange(query: {
        startTime: Date;
        endTime: Date;
        geometry?: any;
    }): Promise<MonitoringData[]>;
    deleteById(id: number): Promise<boolean>;
    updateById(id: number, data: Partial<MonitoringData>): Promise<MonitoringData | null>;
    customQuery(sql: string, params?: any[]): Promise<any[]>;
}
//# sourceMappingURL=MonitoringDataModel.d.ts.map