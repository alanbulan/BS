import { BaseModel } from './BaseModel';
import { RiskZone, Point, Polygon } from '../types';
export declare class RiskZoneModel extends BaseModel {
    constructor();
    paginate(page?: number, limit?: number, conditions?: Record<string, any>, sortBy?: string, sortOrder?: string): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    findById(id: number): Promise<RiskZone | null>;
    findByCode(code: string): Promise<RiskZone | null>;
    createRiskZone(zoneData: Partial<RiskZone>): Promise<RiskZone>;
    updateRiskZone(id: number, zoneData: Partial<RiskZone>): Promise<RiskZone | null>;
    findByLocation(location: Point): Promise<RiskZone[]>;
    findNearbyZones(location: Point, radiusKm?: number): Promise<RiskZone[]>;
    findByDisasterType(disasterTypeId: number): Promise<RiskZone[]>;
    findByRiskLevel(minLevel: number, maxLevel?: number): Promise<RiskZone[]>;
    getZoneStats(): Promise<any>;
    codeExists(code: string, excludeId?: number): Promise<boolean>;
    getZoneBounds(id: number): Promise<any>;
    findOverlappingZones(geometry: Polygon): Promise<RiskZone[]>;
    getStatistics(): Promise<{
        total: number;
        highRisk: number;
        byDisasterType: Record<string, number>;
        byRiskLevel: Record<string, number>;
    }>;
    getRiskLevelDistribution(): Promise<Record<string, number>>;
    static findById(id: number): Promise<RiskZone | null>;
    static findByCode(code: string): Promise<RiskZone | null>;
    static findByLocation(location: Point): Promise<RiskZone[]>;
    static update(id: number, data: Record<string, any>): Promise<RiskZone | null>;
    static delete(id: number): Promise<boolean>;
    static getStatistics(): Promise<{
        total: number;
        highRisk: number;
        byDisasterType: Record<string, number>;
        byRiskLevel: Record<string, number>;
    }>;
    static createZone(zoneData: any): Promise<RiskZone>;
    static paginate(page: number, limit: number, filters?: any, sortBy?: string, sortOrder?: string): Promise<{
        data: RiskZone[];
        pagination: any;
    }>;
}
//# sourceMappingURL=RiskZoneModel.d.ts.map