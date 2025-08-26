import { BaseModel } from './BaseModel';
import { Shelter, LocationQuery } from '../types';
export declare class ShelterModel extends BaseModel {
    constructor();
    create(data: Omit<Shelter, 'id' | 'created_at' | 'updated_at'>): Promise<Shelter>;
    findNearest(location: LocationQuery, limit?: number): Promise<Shelter[]>;
    findWithPagination(options: {
        conditions?: any;
        pagination: {
            page: number;
            limit: number;
            offset: number;
        };
        sort: {
            field: string;
            order: 'ASC' | 'DESC';
        };
    }): Promise<{
        data: Shelter[];
        pagination: any;
    }>;
    getStatistics(): Promise<any>;
    getShelterTypes(): Promise<string[]>;
    updateOccupancy(id: number, occupancy: number): Promise<Shelter | null>;
    getHighOccupancyShelters(threshold?: number): Promise<Shelter[]>;
    findInArea(bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    }): Promise<Shelter[]>;
    checkAvailability(id: number): Promise<{
        available: boolean;
        remaining_capacity: number;
        occupancy_rate: number;
    }>;
}
//# sourceMappingURL=ShelterModel.d.ts.map