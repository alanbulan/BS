import { Point, EscapeRoute } from '../types';
export interface RouteOptions {
    endPoint?: Point;
    avoidHighRiskZones?: boolean;
    maxDistance?: number;
    routeType?: 'fastest' | 'safest' | 'shortest';
    transportMode?: 'walking' | 'driving' | 'cycling';
}
export interface RouteResult {
    route: EscapeRoute;
    alternativeRoutes?: EscapeRoute[];
    warnings?: string[];
    estimatedTime: number;
    totalDistance: number;
    safetyScore: number;
}
export declare class RouteCalculationService {
    private escapeRouteModel;
    private riskZoneModel;
    constructor();
    calculateEscapeRoute(startPoint: Point, options?: RouteOptions): Promise<RouteResult>;
    private findNearestShelter;
    private getRoadNetwork;
    private getRiskZonesAlongRoute;
    private calculateOptimalPath;
    private calculateAlternativeRoutes;
    private calculateSaferRoute;
    private calculateShortestRoute;
    private calculateDistance;
    private estimateTime;
    private calculateDifficulty;
    private calculateRouteSafety;
    private generateRouteWarnings;
    updateRouteStatus(routeId: number, currentLocation: Point): Promise<{
        remainingDistance: number;
        remainingTime: number;
        nextInstruction: string;
        needsRerouting: boolean;
    }>;
    private generateNextInstruction;
    checkForRerouting(routeId: number, currentLocation: Point): Promise<boolean>;
}
//# sourceMappingURL=RouteCalculationService.d.ts.map