import { BaseModel } from './BaseModel';
import { LineString } from '../types';
export interface RoadNetwork {
    id: number;
    road_id?: string;
    road_name?: string;
    geometry?: LineString;
    road_type?: string;
    road_condition?: string;
    width_meters?: number;
    speed_limit?: number;
    condition_score?: number;
    is_emergency_route: boolean;
    is_accessible?: boolean;
    maintenance_status?: string;
    last_inspection?: Date;
    traffic_capacity?: number;
    surface_type?: string;
    slope_grade?: number;
    bridge_info?: any;
    tunnel_info?: any;
    weather_restrictions?: any;
    emergency_contact?: any;
    created_at: Date;
    updated_at: Date;
}
export interface CreateRoadNetworkData {
    road_id?: string;
    road_name?: string;
    geometry?: LineString;
    road_type?: string;
    road_condition?: string;
    width_meters?: number;
    speed_limit?: number;
    condition_score?: number;
    is_emergency_route?: boolean;
    is_accessible?: boolean;
    maintenance_status?: string;
    last_inspection?: Date;
    traffic_capacity?: number;
    surface_type?: string;
    slope_grade?: number;
    bridge_info?: any;
    tunnel_info?: any;
    weather_restrictions?: any;
    emergency_contact?: any;
}
export interface UpdateRoadNetworkData {
    road_id?: string;
    road_name?: string;
    geometry?: LineString;
    road_type?: string;
    road_condition?: string;
    width_meters?: number;
    speed_limit?: number;
    condition_score?: number;
    is_emergency_route?: boolean;
    is_accessible?: boolean;
    maintenance_status?: string;
    last_inspection?: Date;
    traffic_capacity?: number;
    surface_type?: string;
    slope_grade?: number;
    bridge_info?: any;
    tunnel_info?: any;
    weather_restrictions?: any;
    emergency_contact?: any;
}
export interface RoadNetworkQuery {
    road_type?: string;
    road_condition?: string;
    is_emergency_route?: boolean;
    is_accessible?: boolean;
    maintenance_status?: string;
    surface_type?: string;
    min_condition_score?: number;
    limit?: number;
    offset?: number;
}
export declare class RoadNetworkModel extends BaseModel {
    constructor();
    create(data: CreateRoadNetworkData): Promise<RoadNetwork>;
    findWithConditions(conditions: RoadNetworkQuery): Promise<{
        roads: RoadNetwork[];
        total: number;
    }>;
    findInArea(bounds: {
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
    }): Promise<RoadNetwork[]>;
    findEmergencyRoutes(): Promise<RoadNetwork[]>;
    findNearPoint(point: {
        lng: number;
        lat: number;
    }, radiusMeters: number): Promise<RoadNetwork[]>;
    updateById(id: number, data: UpdateRoadNetworkData): Promise<RoadNetwork | null>;
    findByRoadId(roadId: string): Promise<RoadNetwork | null>;
    getStatistics(): Promise<{
        total: number;
        byType: Record<string, number>;
        byMaintenanceStatus: Record<string, number>;
        emergencyRoutes: number;
    }>;
}
//# sourceMappingURL=RoadNetworkModel.d.ts.map