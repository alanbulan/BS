import { BaseModel } from './BaseModel';
import { Point, LineString } from '../types';
export interface EscapeRoute {
    id: number;
    route_id?: string;
    start_point?: Point;
    end_point?: Point;
    route_geometry?: LineString;
    distance_meters?: number;
    estimated_time_minutes?: number;
    difficulty_level?: number;
    elevation_gain?: number;
    route_conditions?: any;
    waypoints?: any;
    alternative_routes?: any;
    safety_score?: number;
    weather_dependency?: any;
    accessibility_info?: any;
    last_verified_date?: Date;
    verification_status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateEscapeRouteData {
    route_id?: string;
    start_point?: Point;
    end_point?: Point;
    route_geometry?: LineString;
    distance_meters?: number;
    estimated_time_minutes?: number;
    difficulty_level?: number;
    elevation_gain?: number;
    route_conditions?: any;
    waypoints?: any;
    alternative_routes?: any;
    safety_score?: number;
    weather_dependency?: any;
    accessibility_info?: any;
    last_verified_date?: Date;
    verification_status?: string;
}
export interface UpdateEscapeRouteData {
    route_id?: string;
    start_point?: Point;
    end_point?: Point;
    route_geometry?: LineString;
    distance_meters?: number;
    estimated_time_minutes?: number;
    difficulty_level?: number;
    elevation_gain?: number;
    route_conditions?: any;
    waypoints?: any;
    alternative_routes?: any;
    safety_score?: number;
    weather_dependency?: any;
    accessibility_info?: any;
    last_verified_date?: Date;
    verification_status?: string;
}
export interface EscapeRouteQuery {
    difficulty_level?: number;
    verification_status?: string;
    min_safety_score?: number;
    max_distance?: number;
    limit?: number;
    offset?: number;
    route_id?: string;
}
export declare class EscapeRouteModel extends BaseModel {
    constructor();
    findById(id: number): Promise<EscapeRoute | null>;
    create(data: CreateEscapeRouteData): Promise<EscapeRoute>;
    findWithConditions(conditions: EscapeRouteQuery): Promise<{
        routes: EscapeRoute[];
        total: number;
    }>;
    findFromPoint(point: Point, maxDistance?: number): Promise<EscapeRoute[]>;
    findToShelter(shelterPoint: Point, maxDistance?: number): Promise<EscapeRoute[]>;
    findInArea(bounds: {
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
    }): Promise<EscapeRoute[]>;
    updateById(id: number, data: UpdateEscapeRouteData): Promise<EscapeRoute | null>;
    findByRouteId(routeId: string): Promise<EscapeRoute | null>;
    verifyRoute(id: number, status: string, notes?: string): Promise<EscapeRoute | null>;
    getStatistics(): Promise<{
        total: number;
        byDifficulty: Record<string, number>;
        byStatus: Record<string, number>;
        averageSafetyScore: number;
        averageDistance: number;
    }>;
    private parseGeometryFields;
}
//# sourceMappingURL=EscapeRouteModel.d.ts.map