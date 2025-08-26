"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscapeRouteController = void 0;
const BaseController_1 = require("./BaseController");
const EscapeRouteModel_1 = require("../models/EscapeRouteModel");
const asyncHandler_1 = require("../middleware/asyncHandler");
class EscapeRouteController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.createRoute = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { route_id, start_point, end_point, route_geometry, distance_meters, estimated_time_minutes, difficulty_level, elevation_gain, route_conditions, waypoints, alternative_routes, safety_score, weather_dependency, accessibility_info, last_verified_date, verification_status } = req.body;
            if (!route_geometry) {
                return this.error(res, '路径几何信息是必填的', 400);
            }
            const routeData = {
                route_id,
                start_point,
                end_point,
                route_geometry,
                distance_meters,
                estimated_time_minutes,
                difficulty_level,
                elevation_gain,
                route_conditions,
                waypoints,
                alternative_routes,
                safety_score,
                weather_dependency,
                accessibility_info,
                last_verified_date: last_verified_date ? new Date(last_verified_date) : undefined,
                verification_status
            };
            const route = await this.escapeRouteModel.create(routeData);
            this.created(res, route, '逃生路径创建成功');
            return;
        });
        this.getRoutes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { difficulty_level, verification_status, min_safety_score, max_distance, page = 1, limit = 20, route_id } = req.query;
            const conditions = {
                difficulty_level: difficulty_level ? parseInt(difficulty_level) : undefined,
                verification_status: verification_status,
                min_safety_score: min_safety_score ? parseFloat(min_safety_score) : undefined,
                max_distance: max_distance ? parseFloat(max_distance) : undefined,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                route_id: route_id ? String(route_id) : undefined
            };
            const result = await this.escapeRouteModel.findWithConditions(conditions);
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const totalPages = Math.ceil(result.total / limitNum);
            this.paginated(res, result.routes, {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                pages: totalPages
            });
            return;
        });
        this.getRouteById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const routeId = parseInt(id);
            if (isNaN(routeId)) {
                return this.error(res, '无效的路径ID', 400);
            }
            const route = await this.escapeRouteModel.findById(routeId);
            if (!route) {
                return this.notFound(res, '逃生路径不存在');
            }
            this.success(res, route);
            return;
        });
        this.getRouteByRouteId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { routeId } = req.params;
            const route = await this.escapeRouteModel.findByRouteId(routeId);
            if (!route) {
                return this.notFound(res, '逃生路径不存在');
            }
            this.success(res, route);
            return;
        });
        this.getRoutesFromPoint = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { lng, lat, maxDistance = 5000 } = req.query;
            if (!lng || !lat) {
                return this.error(res, '经纬度参数是必填的', 400);
            }
            const point = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
            const routes = await this.escapeRouteModel.findFromPoint(point, parseInt(maxDistance));
            this.success(res, routes);
            return;
        });
        this.getRoutesToShelter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { lng, lat, maxDistance = 10000 } = req.query;
            if (!lng || !lat) {
                return this.error(res, '经纬度参数是必填的', 400);
            }
            const shelterPoint = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
            const routes = await this.escapeRouteModel.findToShelter(shelterPoint, parseInt(maxDistance));
            this.success(res, routes);
            return;
        });
        this.getRoutesInArea = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { minLng, minLat, maxLng, maxLat } = req.query;
            if (!minLng || !minLat || !maxLng || !maxLat) {
                return this.error(res, '区域边界参数是必填的', 400);
            }
            const bounds = {
                minLng: parseFloat(minLng),
                minLat: parseFloat(minLat),
                maxLng: parseFloat(maxLng),
                maxLat: parseFloat(maxLat)
            };
            const routes = await this.escapeRouteModel.findInArea(bounds);
            this.success(res, routes);
            return;
        });
        this.updateRoute = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const routeId = parseInt(id);
            if (isNaN(routeId)) {
                return this.error(res, '无效的路径ID', 400);
            }
            const { route_id, start_point, end_point, route_geometry, distance_meters, estimated_time_minutes, difficulty_level, elevation_gain, route_conditions, waypoints, alternative_routes, safety_score, weather_dependency, accessibility_info, last_verified_date, verification_status } = req.body;
            const updateData = {
                route_id,
                start_point,
                end_point,
                route_geometry,
                distance_meters,
                estimated_time_minutes,
                difficulty_level,
                elevation_gain,
                route_conditions,
                waypoints,
                alternative_routes,
                safety_score,
                weather_dependency,
                accessibility_info,
                last_verified_date: last_verified_date ? new Date(last_verified_date) : undefined,
                verification_status
            };
            const route = await this.escapeRouteModel.updateById(routeId, updateData);
            if (!route) {
                return this.notFound(res, '逃生路径不存在');
            }
            this.success(res, route, '逃生路径更新成功');
            return;
        });
        this.verifyRoute = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { status, notes } = req.body;
            const routeId = parseInt(id);
            if (isNaN(routeId)) {
                return this.error(res, '无效的路径ID', 400);
            }
            if (!status || !['verified', 'rejected', 'pending'].includes(status)) {
                return this.error(res, '无效的验证状态', 400);
            }
            const route = await this.escapeRouteModel.verifyRoute(routeId, status, notes);
            if (!route) {
                return this.notFound(res, '逃生路径不存在');
            }
            this.success(res, route, '路径验证状态更新成功');
            return;
        });
        this.deleteRoute = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const routeId = parseInt(id);
            if (isNaN(routeId)) {
                return this.error(res, '无效的路径ID', 400);
            }
            const success = await this.escapeRouteModel.delete(routeId);
            if (!success) {
                return this.notFound(res, '逃生路径不存在');
            }
            this.success(res, null, '逃生路径删除成功');
            return;
        });
        this.getStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await this.escapeRouteModel.getStatistics();
            this.success(res, statistics);
            return;
        });
        this.batchImport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { routes } = req.body;
            if (!Array.isArray(routes) || routes.length === 0) {
                return this.error(res, '路径数据不能为空', 400);
            }
            const results = [];
            const errors = [];
            for (let i = 0; i < routes.length; i++) {
                try {
                    const routeData = routes[i];
                    if (!routeData.route_geometry) {
                        errors.push({ index: i, error: '路径几何信息是必填的' });
                        continue;
                    }
                    const route = await this.escapeRouteModel.create(routeData);
                    results.push(route);
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
                routes: results,
                errors
            }, `成功导入 ${results.length} 条逃生路径`);
            return;
        });
        this.getRecommendations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startLng, startLat, endLng, endLat, maxDistance = 10000, minSafetyScore = 0.5 } = req.query;
            if (!startLng || !startLat) {
                return this.error(res, '起点坐标是必填的', 400);
            }
            const startPoint = {
                type: 'Point',
                coordinates: [parseFloat(startLng), parseFloat(startLat)]
            };
            let routes;
            if (endLng && endLat) {
                const endPoint = {
                    type: 'Point',
                    coordinates: [parseFloat(endLng), parseFloat(endLat)]
                };
                routes = await this.escapeRouteModel.findToShelter(endPoint, parseInt(maxDistance));
            }
            else {
                routes = await this.escapeRouteModel.findFromPoint(startPoint, parseInt(maxDistance));
            }
            const filteredRoutes = routes.filter(route => (route.safety_score || 0) >= parseFloat(minSafetyScore));
            const sortedRoutes = filteredRoutes.sort((a, b) => {
                const scoreA = a.safety_score || 0;
                const scoreB = b.safety_score || 0;
                const distanceA = a.distance_meters || Infinity;
                const distanceB = b.distance_meters || Infinity;
                if (scoreB !== scoreA) {
                    return scoreB - scoreA;
                }
                return distanceA - distanceB;
            });
            this.success(res, {
                total: sortedRoutes.length,
                routes: sortedRoutes.slice(0, 10),
                criteria: {
                    maxDistance: parseInt(maxDistance),
                    minSafetyScore: parseFloat(minSafetyScore)
                }
            });
            return;
        });
        this.escapeRouteModel = new EscapeRouteModel_1.EscapeRouteModel();
    }
}
exports.EscapeRouteController = EscapeRouteController;
//# sourceMappingURL=EscapeRouteController.js.map