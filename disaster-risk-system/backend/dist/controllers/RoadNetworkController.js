"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadNetworkController = void 0;
const BaseController_1 = require("./BaseController");
const RoadNetworkModel_1 = require("../models/RoadNetworkModel");
const asyncHandler_1 = require("../middleware/asyncHandler");
class RoadNetworkController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.createRoad = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { road_id, road_name, geometry, road_type, road_condition, width_meters, speed_limit, condition_score, is_emergency_route = false, is_accessible = true, maintenance_status = 'good', last_inspection, traffic_capacity, surface_type, slope_grade, bridge_info, tunnel_info, weather_restrictions, emergency_contact } = req.body;
            if (!geometry) {
                return this.error(res, '道路几何信息是必填的', 400);
            }
            const roadData = {
                road_id,
                road_name,
                geometry,
                road_type,
                road_condition,
                width_meters,
                speed_limit,
                condition_score,
                is_emergency_route,
                is_accessible,
                maintenance_status,
                last_inspection: last_inspection ? new Date(last_inspection) : undefined,
                traffic_capacity,
                surface_type,
                slope_grade,
                bridge_info,
                tunnel_info,
                weather_restrictions,
                emergency_contact
            };
            const road = await this.roadNetworkModel.create(roadData);
            this.created(res, road, '道路网络记录创建成功');
            return;
        });
        this.getRoads = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { road_type, surface_type, is_emergency_route, maintenance_status, min_condition_score, page = 1, limit = 20 } = req.query;
            const conditions = {
                road_type: road_type,
                surface_type: surface_type,
                is_emergency_route: is_emergency_route !== undefined ? is_emergency_route === 'true' : undefined,
                maintenance_status: maintenance_status,
                min_condition_score: min_condition_score ? parseFloat(min_condition_score) : undefined,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };
            const result = await this.roadNetworkModel.findWithConditions(conditions);
            this.paginated(res, result.roads, {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit))
            });
            return;
        });
        this.getRoadById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const roadId = parseInt(id);
            if (isNaN(roadId)) {
                return this.error(res, '无效的道路ID', 400);
            }
            const road = await this.roadNetworkModel.findById(roadId);
            if (!road) {
                return this.notFound(res, '道路网络记录不存在');
            }
            this.success(res, road);
            return;
        });
        this.getRoadByRoadId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { roadId } = req.params;
            const road = await this.roadNetworkModel.findByRoadId(roadId);
            if (!road) {
                return this.error(res, '道路网络记录未找到', 404);
            }
            this.success(res, road);
            return;
        });
        this.getRoadsInArea = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { minLng, minLat, maxLng, maxLat, roadType } = req.query;
            if (!minLng || !minLat || !maxLng || !maxLat) {
                return this.error(res, '区域边界参数是必填的', 400);
            }
            const bounds = {
                minLng: parseFloat(minLng),
                minLat: parseFloat(minLat),
                maxLng: parseFloat(maxLng),
                maxLat: parseFloat(maxLat)
            };
            const roads = await this.roadNetworkModel.findInArea(bounds);
            this.success(res, roads);
            return;
        });
        this.getEmergencyRoutes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const roads = await this.roadNetworkModel.findEmergencyRoutes();
            this.success(res, roads);
            return;
        });
        this.getRoadsNearPoint = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { lng, lat, radius = 1000, roadType } = req.query;
            if (!lng || !lat) {
                return this.error(res, '经纬度参数是必填的', 400);
            }
            const point = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
            const roads = await this.roadNetworkModel.findNearPoint({ lng: point.coordinates[0], lat: point.coordinates[1] }, parseInt(radius));
            this.success(res, roads);
            return;
        });
        this.updateRoad = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const roadId = parseInt(id);
            if (isNaN(roadId)) {
                return this.error(res, '无效的道路ID', 400);
            }
            const { road_id, road_name, road_type, geometry, width_meters, surface_type, condition_score, speed_limit, traffic_capacity, is_emergency_route, is_accessible, maintenance_status, last_inspection, slope_grade, bridge_info, tunnel_info, weather_restrictions, emergency_contact } = req.body;
            const updateData = {
                road_id,
                road_name,
                road_type,
                geometry,
                width_meters,
                surface_type,
                condition_score,
                speed_limit,
                traffic_capacity,
                is_emergency_route,
                is_accessible,
                maintenance_status,
                last_inspection: last_inspection ? new Date(last_inspection) : undefined,
                slope_grade,
                bridge_info,
                tunnel_info,
                weather_restrictions,
                emergency_contact
            };
            const road = await this.roadNetworkModel.updateById(roadId, updateData);
            if (!road) {
                return this.notFound(res, '道路网络记录不存在');
            }
            this.success(res, road, '道路网络记录更新成功');
            return;
        });
        this.deleteRoad = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const roadId = parseInt(id);
            if (isNaN(roadId)) {
                return this.error(res, '无效的道路ID', 400);
            }
            const success = await this.roadNetworkModel.delete(roadId);
            if (!success) {
                return this.notFound(res, '道路网络记录不存在');
            }
            this.success(res, null, '道路网络记录删除成功');
            return;
        });
        this.getStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await this.roadNetworkModel.getStatistics();
            this.success(res, statistics);
            return;
        });
        this.batchImport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { roads } = req.body;
            if (!Array.isArray(roads) || roads.length === 0) {
                return this.error(res, '道路数据不能为空', 400);
            }
            const results = [];
            const errors = [];
            for (let i = 0; i < roads.length; i++) {
                try {
                    const roadData = roads[i];
                    if (!roadData.geometry || !roadData.road_type) {
                        errors.push({ index: i, error: '道路几何信息和道路类型是必填的' });
                        continue;
                    }
                    const road = await this.roadNetworkModel.create(roadData);
                    results.push(road);
                }
                catch (error) {
                    errors.push({
                        index: i,
                        error: error instanceof Error ? error.message : '未知错误'
                    });
                }
            }
            this.success(res, {
                imported: results.length,
                failed: errors.length,
                roads: results,
                errors
            }, `成功导入 ${results.length} 条道路网络记录`);
            return;
        });
        this.updateConditionScore = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { condition_score, inspection_notes } = req.body;
            const roadId = parseInt(id);
            if (isNaN(roadId)) {
                return this.error(res, '无效的道路ID', 400);
            }
            if (condition_score === undefined || condition_score < 0 || condition_score > 1) {
                return this.error(res, '状况评分必须在0-1之间', 400);
            }
            const updateData = {
                condition_score,
                last_inspection: new Date()
            };
            const road = await this.roadNetworkModel.updateById(roadId, updateData);
            if (!road) {
                return this.notFound(res, '道路网络记录不存在');
            }
            this.success(res, road, '道路状况评分更新成功');
            return;
        });
        this.setEmergencyRoute = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { is_emergency_route } = req.body;
            const roadId = parseInt(id);
            if (isNaN(roadId)) {
                return this.error(res, '无效的道路ID', 400);
            }
            if (typeof is_emergency_route !== 'boolean') {
                return this.error(res, '应急路线标识必须是布尔值', 400);
            }
            const road = await this.roadNetworkModel.updateById(roadId, { is_emergency_route });
            if (!road) {
                return this.notFound(res, '道路网络记录不存在');
            }
            this.success(res, road, is_emergency_route ? '已设置为应急路线' : '已取消应急路线设置');
            return;
        });
        this.getConnectivityAnalysis = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startLng, startLat, endLng, endLat, roadTypes } = req.query;
            if (!startLng || !startLat || !endLng || !endLat) {
                return this.error(res, '起点和终点坐标是必填的', 400);
            }
            const startPoint = {
                type: 'Point',
                coordinates: [parseFloat(startLng), parseFloat(startLat)]
            };
            const endPoint = {
                type: 'Point',
                coordinates: [parseFloat(endLng), parseFloat(endLat)]
            };
            const startRoads = await this.roadNetworkModel.findNearPoint({ lng: startPoint.coordinates[0], lat: startPoint.coordinates[1] }, 500);
            const endRoads = await this.roadNetworkModel.findNearPoint({ lng: endPoint.coordinates[0], lat: endPoint.coordinates[1] }, 500);
            const analysis = {
                startPoint,
                endPoint,
                nearbyRoadsAtStart: startRoads.length,
                nearbyRoadsAtEnd: endRoads.length,
                hasConnection: startRoads.length > 0 && endRoads.length > 0,
                startRoads: startRoads.slice(0, 5),
                endRoads: endRoads.slice(0, 5),
                recommendations: []
            };
            if (!analysis.hasConnection) {
                analysis.recommendations.push('起点或终点附近缺少道路连接');
            }
            if (startRoads.length === 0) {
                analysis.recommendations.push('起点附近500米内无道路');
            }
            if (endRoads.length === 0) {
                analysis.recommendations.push('终点附近500米内无道路');
            }
            this.success(res, analysis);
            return;
        });
        this.getQualityReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { roadType, minConditionScore = 0 } = req.query;
            const conditions = {
                road_type: roadType,
                min_condition_score: parseFloat(minConditionScore)
            };
            const result = await this.roadNetworkModel.findWithConditions(conditions);
            const roads = result.roads;
            const report = {
                totalRoads: roads.length,
                averageConditionScore: roads.reduce((sum, road) => sum + (road.condition_score || 0), 0) / roads.length,
                roadsByCondition: {
                    excellent: roads.filter(r => (r.condition_score ?? 0) >= 0.8).length,
                    good: roads.filter(r => (r.condition_score ?? 0) >= 0.6 && (r.condition_score ?? 0) < 0.8).length,
                    fair: roads.filter(r => (r.condition_score ?? 0) >= 0.4 && (r.condition_score ?? 0) < 0.6).length,
                    poor: roads.filter(r => (r.condition_score ?? 0) < 0.4).length
                },
                emergencyRoutes: roads.filter(r => r.is_emergency_route).length,
                needsInspection: roads.filter(r => {
                    if (!r.last_inspection)
                        return true;
                    const daysSinceInspection = (Date.now() - new Date(r.last_inspection).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceInspection > 365;
                }).length,
                roadsByType: roads.reduce((acc, road) => {
                    if (road.road_type) {
                        acc[road.road_type] = (acc[road.road_type] || 0) + 1;
                    }
                    return acc;
                }, {})
            };
            this.success(res, report);
            return;
        });
        this.roadNetworkModel = new RoadNetworkModel_1.RoadNetworkModel();
    }
}
exports.RoadNetworkController = RoadNetworkController;
//# sourceMappingURL=RoadNetworkController.js.map