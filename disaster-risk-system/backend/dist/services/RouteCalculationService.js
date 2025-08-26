"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteCalculationService = void 0;
const RiskZoneModel_1 = require("../models/RiskZoneModel");
const EscapeRouteModel_1 = require("../models/EscapeRouteModel");
class RouteCalculationService {
    constructor() {
        this.escapeRouteModel = new EscapeRouteModel_1.EscapeRouteModel();
        this.riskZoneModel = new RiskZoneModel_1.RiskZoneModel();
    }
    async calculateEscapeRoute(startPoint, options = {}) {
        try {
            let targetPoint = options.endPoint;
            if (!targetPoint) {
                const nearestShelter = await this.findNearestShelter(startPoint);
                if (!nearestShelter || !nearestShelter.location) {
                    throw new Error('附近没有找到可用的避难场所');
                }
                targetPoint = nearestShelter.location;
            }
            const roadNetwork = await this.getRoadNetwork(startPoint, targetPoint);
            const riskZones = await this.getRiskZonesAlongRoute(startPoint, targetPoint);
            const mainRoute = await this.calculateOptimalPath(startPoint, targetPoint, roadNetwork, riskZones, options);
            const alternativeRoutes = await this.calculateAlternativeRoutes(startPoint, targetPoint, roadNetwork, riskZones, options, mainRoute);
            const safetyScore = this.calculateRouteSafety(mainRoute, riskZones);
            const warnings = this.generateRouteWarnings(mainRoute, riskZones);
            return {
                route: mainRoute,
                alternativeRoutes,
                warnings,
                estimatedTime: mainRoute.estimated_time_minutes || 0,
                totalDistance: mainRoute.distance_meters || 0,
                safetyScore
            };
        }
        catch (error) {
            console.error('路径计算失败:', error);
            throw error;
        }
    }
    async findNearestShelter(location) {
        return {
            id: 1,
            name: '市民广场避难场所',
            location: {
                type: 'Point',
                coordinates: [location.coordinates[0] + 0.01, location.coordinates[1] + 0.01]
            },
            capacity: 1000,
            current_occupancy: 0,
            shelter_type: '临时避难场所',
            facilities: {
                medical: true,
                food: true,
                water: true,
                communication: true
            },
            contact_info: {
                phone: '110',
                manager: '应急管理部门'
            },
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };
    }
    async getRoadNetwork(startPoint, endPoint) {
        return [
            {
                id: 1,
                road_id: 'RD001',
                road_name: '主干道',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        startPoint.coordinates,
                        [
                            (startPoint.coordinates[0] + endPoint.coordinates[0]) / 2,
                            (startPoint.coordinates[1] + endPoint.coordinates[1]) / 2
                        ],
                        endPoint.coordinates
                    ]
                },
                road_type: 'primary',
                road_condition: 'good',
                width_meters: 12,
                speed_limit: 60,
                is_emergency_route: false,
                is_accessible: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
    }
    async getRiskZonesAlongRoute(startPoint, endPoint) {
        try {
            const midPoint = {
                type: 'Point',
                coordinates: [
                    (startPoint.coordinates[0] + endPoint.coordinates[0]) / 2,
                    (startPoint.coordinates[1] + endPoint.coordinates[1]) / 2
                ]
            };
            const distance = Math.sqrt(Math.pow(endPoint.coordinates[0] - startPoint.coordinates[0], 2) +
                Math.pow(endPoint.coordinates[1] - startPoint.coordinates[1], 2)) * 111.32;
            const searchRadius = Math.max(distance / 2 + 5, 10);
            const riskZones = await this.riskZoneModel.findNearbyZones(midPoint, searchRadius);
            return riskZones;
        }
        catch (error) {
            console.error('获取风险区域失败:', error);
            return [];
        }
    }
    async calculateOptimalPath(startPoint, endPoint, roadNetwork, riskZones, options) {
        const distance = this.calculateDistance(startPoint, endPoint);
        const estimatedTime = this.estimateTime(distance, options.transportMode || 'walking');
        const route = {
            id: 0,
            route_id: `RT${Date.now()}`,
            start_point: startPoint,
            end_point: endPoint,
            route_geometry: {
                type: 'LineString',
                coordinates: [startPoint.coordinates, endPoint.coordinates]
            },
            distance_meters: distance,
            estimated_time_minutes: estimatedTime,
            difficulty_level: this.calculateDifficulty(distance, riskZones.length),
            route_conditions: {
                road_type: 'mixed',
                traffic_condition: 'normal',
                weather_impact: 'none',
                risk_level: riskZones.length > 0 ? 3 : 1
            },
            verification_status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
        };
        route.safety_score = this.calculateRouteSafety(route, riskZones);
        return route;
    }
    async calculateAlternativeRoutes(startPoint, endPoint, roadNetwork, riskZones, options, mainRoute) {
        const alternatives = [];
        const safeRoute = await this.calculateSaferRoute(startPoint, endPoint, riskZones, options);
        if (safeRoute && safeRoute.id !== mainRoute.id) {
            alternatives.push(safeRoute);
        }
        const shortestRoute = await this.calculateShortestRoute(startPoint, endPoint, options);
        if (shortestRoute && shortestRoute.id !== mainRoute.id) {
            alternatives.push(shortestRoute);
        }
        return alternatives;
    }
    async calculateSaferRoute(startPoint, endPoint, riskZones, options = {}) {
        try {
            const routes = await this.escapeRouteModel.findFromPoint(startPoint, options.maxDistance || 5000);
            if (routes.length === 0) {
                throw new Error('未找到可用的逃生路线');
            }
            const saferRoute = routes.sort((a, b) => (b.safety_score || 0) - (a.safety_score || 0))[0];
            return saferRoute;
        }
        catch (error) {
            console.error('计算安全路径失败:', error);
            throw new Error('计算安全路径失败');
        }
    }
    async calculateShortestRoute(startPoint, endPoint, options = {}) {
        try {
            const routes = await this.escapeRouteModel.findFromPoint(startPoint, options.maxDistance || 5000);
            if (routes.length === 0) {
                throw new Error('未找到可用的逃生路线');
            }
            const shortestRoute = routes.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0))[0];
            return shortestRoute;
        }
        catch (error) {
            console.error('计算最短路径失败:', error);
            throw new Error('计算最短路径失败');
        }
    }
    calculateDistance(point1, point2) {
        const R = 6371000;
        const lat1 = point1.coordinates[1] * Math.PI / 180;
        const lat2 = point2.coordinates[1] * Math.PI / 180;
        const deltaLat = (point2.coordinates[1] - point1.coordinates[1]) * Math.PI / 180;
        const deltaLng = (point2.coordinates[0] - point1.coordinates[0]) * Math.PI / 180;
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    estimateTime(distance, transportMode) {
        const speeds = {
            walking: 5,
            cycling: 15,
            driving: 40
        };
        const speed = speeds[transportMode] || speeds.walking;
        return Math.round((distance / 1000) / speed * 60);
    }
    calculateDifficulty(distance, riskZoneCount) {
        let difficultyScore = 1;
        if (distance > 5000)
            difficultyScore += 1;
        if (distance > 10000)
            difficultyScore += 1;
        difficultyScore += Math.min(riskZoneCount, 2);
        return Math.min(difficultyScore, 5);
    }
    calculateRouteSafety(route, riskZones) {
        let safetyScore = 5;
        safetyScore -= Math.min(riskZones.length * 0.5, 2);
        if (route.route_conditions && route.route_conditions.risk_level > 2) {
            safetyScore -= 1;
        }
        if (route.difficulty_level && route.difficulty_level >= 4) {
            safetyScore -= 0.5;
        }
        return Math.max(safetyScore, 1);
    }
    generateRouteWarnings(route, riskZones) {
        const warnings = [];
        if (riskZones.length > 0) {
            warnings.push(`路径经过 ${riskZones.length} 个风险区域，请谨慎通行`);
        }
        if (route.difficulty_level && route.difficulty_level >= 4) {
            warnings.push('路径难度较高，建议选择备选路径');
        }
        if (route.distance_meters && route.distance_meters > 10000) {
            warnings.push('路径较长，请确保体力充足');
        }
        if (route.route_conditions && route.route_conditions.weather_impact !== 'none') {
            warnings.push('天气条件可能影响通行，请注意安全');
        }
        return warnings;
    }
    async updateRouteStatus(routeId, currentLocation) {
        try {
            const route = await this.escapeRouteModel.findById(routeId);
            if (!route) {
                throw new Error('路径不存在');
            }
            let endPoint = null;
            if (route.end_point) {
                endPoint = {
                    type: 'Point',
                    coordinates: [route.end_point.coordinates[0], route.end_point.coordinates[1]]
                };
            }
            else if (route.route_geometry?.coordinates?.length) {
                const last = route.route_geometry.coordinates[route.route_geometry.coordinates.length - 1];
                endPoint = {
                    type: 'Point',
                    coordinates: [last[0], last[1]]
                };
            }
            if (!endPoint) {
                throw new Error('路径缺少终点几何信息');
            }
            const remainingDistance = this.calculateDistance(currentLocation, endPoint);
            const remainingTime = this.estimateTime(remainingDistance, 'walking');
            const nextInstruction = this.generateNextInstruction(currentLocation, route);
            const needsRerouting = await this.checkForRerouting(routeId, currentLocation);
            return {
                remainingDistance: Math.round(remainingDistance),
                remainingTime: Math.round(remainingTime),
                nextInstruction,
                needsRerouting
            };
        }
        catch (error) {
            console.error('更新路径状态失败:', error);
            return {
                remainingDistance: 0,
                remainingTime: 0,
                nextInstruction: '无法获取路径信息',
                needsRerouting: true
            };
        }
    }
    generateNextInstruction(currentLocation, route) {
        try {
            const pathPoints = route.route_geometry?.coordinates || [];
            if (pathPoints.length === 0) {
                return '继续前往目的地';
            }
            let nearestPointIndex = 0;
            let minDistance = Infinity;
            for (let i = 0; i < pathPoints.length; i++) {
                const point = {
                    type: 'Point',
                    coordinates: [pathPoints[i][0], pathPoints[i][1]]
                };
                const distance = this.calculateDistance(currentLocation, point);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPointIndex = i;
                }
            }
            const nextPointIndex = Math.min(nearestPointIndex + 1, pathPoints.length - 1);
            const nextPoint = {
                type: 'Point',
                coordinates: [pathPoints[nextPointIndex][0], pathPoints[nextPointIndex][1]]
            };
            const distanceToNext = this.calculateDistance(currentLocation, nextPoint);
            if (distanceToNext < 50) {
                return '即将到达目的地';
            }
            else if (distanceToNext < 200) {
                return `继续前行${Math.round(distanceToNext)}米`;
            }
            else {
                return `直行${Math.round(distanceToNext)}米`;
            }
        }
        catch (error) {
            console.error('生成指令失败:', error);
            return '继续前往目的地';
        }
    }
    async checkForRerouting(routeId, currentLocation) {
        try {
            const route = await this.escapeRouteModel.findById(routeId);
            if (!route) {
                return true;
            }
            let endPoint = null;
            if (route.end_point) {
                endPoint = {
                    type: 'Point',
                    coordinates: [route.end_point.coordinates[0], route.end_point.coordinates[1]]
                };
            }
            else if (route.route_geometry?.coordinates?.length) {
                const last = route.route_geometry.coordinates[route.route_geometry.coordinates.length - 1];
                endPoint = {
                    type: 'Point',
                    coordinates: [last[0], last[1]]
                };
            }
            if (!endPoint) {
                return true;
            }
            const currentRiskZones = await this.getRiskZonesAlongRoute(currentLocation, endPoint);
            const highRiskZones = currentRiskZones.filter(zone => zone.current_risk_level >= 4);
            if (highRiskZones.length > 0) {
                return true;
            }
            const pathPoints = route.route_geometry?.coordinates || [];
            if (pathPoints.length > 0) {
                let minDistanceToPath = Infinity;
                for (const pathPoint of pathPoints) {
                    const point = {
                        type: 'Point',
                        coordinates: [pathPoint[0], pathPoint[1]]
                    };
                    const distance = this.calculateDistance(currentLocation, point);
                    minDistanceToPath = Math.min(minDistanceToPath, distance);
                }
                if (minDistanceToPath > 500) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('检查重新规划失败:', error);
            return true;
        }
    }
}
exports.RouteCalculationService = RouteCalculationService;
//# sourceMappingURL=RouteCalculationService.js.map