import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RoadNetworkModel, CreateRoadNetworkData, UpdateRoadNetworkData, RoadNetworkQuery } from '../models/RoadNetworkModel';
import { asyncHandler } from '../middleware/asyncHandler';
import { Point, RoadNetwork } from '../types';

export class RoadNetworkController extends BaseController {
  private roadNetworkModel: RoadNetworkModel;

  constructor() {
    super();
    this.roadNetworkModel = new RoadNetworkModel();
  }

  /**
   * 创建道路网络记录
   */
  createRoad = asyncHandler(async (req: Request, res: Response) => {
    const {
      road_id,
      road_name,
      geometry,
      road_type,
      road_condition,
      width_meters,
      speed_limit,
      condition_score,
      is_emergency_route = false,
      is_accessible = true,
      maintenance_status = 'good',
      last_inspection,
      traffic_capacity,
      surface_type,
      slope_grade,
      bridge_info,
      tunnel_info,
      weather_restrictions,
      emergency_contact
    } = req.body;

    // 验证必填字段
    if (!geometry) {
      return this.error(res, '道路几何信息是必填的', 400);
    }

    const roadData: CreateRoadNetworkData = {
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

  /**
   * 获取道路网络列表
   */
  getRoads = asyncHandler(async (req: Request, res: Response) => {
    const {
      road_type,
      surface_type,
      is_emergency_route,
      maintenance_status,
      min_condition_score,
      page = 1,
      limit = 20
    } = req.query;

    const conditions: RoadNetworkQuery = {
      road_type: road_type as string,
      surface_type: surface_type as string,
      is_emergency_route: is_emergency_route !== undefined ? is_emergency_route === 'true' : undefined,
      maintenance_status: maintenance_status as string,
      min_condition_score: min_condition_score ? parseFloat(min_condition_score as string) : undefined,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    };

    const result = await this.roadNetworkModel.findWithConditions(conditions);
    
    this.paginated(res, result.roads, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: result.total,
      pages: Math.ceil(result.total / parseInt(limit as string))
    });
    return;
  });

  /**
   * 根据ID获取道路网络记录
   */
  getRoadById = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 根据道路ID获取道路网络记录
   */
  getRoadByRoadId = asyncHandler(async (req: Request, res: Response) => {
    const { roadId } = req.params;

    const road = await this.roadNetworkModel.findByRoadId(roadId);
    
    if (!road) {
      return this.error(res, '道路网络记录未找到', 404);
    }

    this.success(res, road);
    return;
  });

  /**
   * 查找指定区域内的道路
   */
  getRoadsInArea = asyncHandler(async (req: Request, res: Response) => {
    const { minLng, minLat, maxLng, maxLat, roadType } = req.query;

    if (!minLng || !minLat || !maxLng || !maxLat) {
      return this.error(res, '区域边界参数是必填的', 400);
    }

    const bounds = {
      minLng: parseFloat(minLng as string),
      minLat: parseFloat(minLat as string),
      maxLng: parseFloat(maxLng as string),
      maxLat: parseFloat(maxLat as string)
    };

    const roads = await this.roadNetworkModel.findInArea(bounds);
    this.success(res, roads);
    return;
  });

  /**
   * 查找应急路线
   */
  getEmergencyRoutes = asyncHandler(async (req: Request, res: Response) => {
    const roads = await this.roadNetworkModel.findEmergencyRoutes();

    this.success(res, roads);
    return;
  });

  /**
   * 查找指定点附近的道路
   */
  getRoadsNearPoint = asyncHandler(async (req: Request, res: Response) => {
    const { lng, lat, radius = 1000, roadType } = req.query;

    if (!lng || !lat) {
      return this.error(res, '经纬度参数是必填的', 400);
    }

    const point: Point = {
      type: 'Point',
      coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
    };

    const roads = await this.roadNetworkModel.findNearPoint(
      { lng: point.coordinates[0], lat: point.coordinates[1] },
      parseInt(radius as string)
    );

    this.success(res, roads);
    return;
  });

  /**
   * 更新道路网络记录
   */
  updateRoad = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const roadId = parseInt(id);

    if (isNaN(roadId)) {
      return this.error(res, '无效的道路ID', 400);
    }

    const {
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
      last_inspection,
      slope_grade,
      bridge_info,
      tunnel_info,
      weather_restrictions,
      emergency_contact
    } = req.body;

    const updateData: UpdateRoadNetworkData = {
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

  /**
   * 删除道路网络记录
   */
  deleteRoad = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 获取道路网络统计信息
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.roadNetworkModel.getStatistics();
    this.success(res, statistics);
    return;
  });

  /**
   * 批量导入道路网络数据
   */
  batchImport = asyncHandler(async (req: Request, res: Response) => {
    const { roads } = req.body;

    if (!Array.isArray(roads) || roads.length === 0) {
      return this.error(res, '道路数据不能为空', 400);
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < roads.length; i++) {
      try {
        const roadData = roads[i] as CreateRoadNetworkData;
        
        // 验证必填字段
        if (!roadData.geometry || !roadData.road_type) {
          errors.push({ index: i, error: '道路几何信息和道路类型是必填的' });
          continue;
        }

        const road = await this.roadNetworkModel.create(roadData);
        results.push(road);
      } catch (error) {
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

  /**
   * 更新道路状况评分
   */
  updateConditionScore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { condition_score, inspection_notes } = req.body;
    const roadId = parseInt(id);

    if (isNaN(roadId)) {
      return this.error(res, '无效的道路ID', 400);
    }

    if (condition_score === undefined || condition_score < 0 || condition_score > 1) {
      return this.error(res, '状况评分必须在0-1之间', 400);
    }

    const updateData: UpdateRoadNetworkData = {
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

  /**
   * 设置应急路线
   */
  setEmergencyRoute = asyncHandler(async (req: Request, res: Response) => {
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

    this.success(res, road, 
      is_emergency_route ? '已设置为应急路线' : '已取消应急路线设置'
    );
    return;
  });

  /**
   * 获取道路连通性分析
   */
  getConnectivityAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const { startLng, startLat, endLng, endLat, roadTypes } = req.query;

    if (!startLng || !startLat || !endLng || !endLat) {
      return this.error(res, '起点和终点坐标是必填的', 400);
    }

    const startPoint: Point = {
      type: 'Point',
      coordinates: [parseFloat(startLng as string), parseFloat(startLat as string)]
    };

    const endPoint: Point = {
      type: 'Point',
      coordinates: [parseFloat(endLng as string), parseFloat(endLat as string)]
    };

    // 查找起点和终点附近的道路
    const startRoads = await this.roadNetworkModel.findNearPoint(
      { lng: startPoint.coordinates[0], lat: startPoint.coordinates[1] }, 
      500
    );
    const endRoads = await this.roadNetworkModel.findNearPoint(
      { lng: endPoint.coordinates[0], lat: endPoint.coordinates[1] }, 
      500
    );

    // 简单的连通性分析
    const analysis = {
      startPoint,
      endPoint,
      nearbyRoadsAtStart: startRoads.length,
      nearbyRoadsAtEnd: endRoads.length,
      hasConnection: startRoads.length > 0 && endRoads.length > 0,
      startRoads: startRoads.slice(0, 5), // 返回前5条道路
      endRoads: endRoads.slice(0, 5),
      recommendations: [] as string[]
    };

    // 添加建议
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

  /**
   * 获取道路质量报告
   */
  getQualityReport = asyncHandler(async (req: Request, res: Response) => {
    const { roadType, minConditionScore = 0 } = req.query;

    const conditions: RoadNetworkQuery = {
      road_type: roadType as string,
      min_condition_score: parseFloat(minConditionScore as string)
    };

    const result = await this.roadNetworkModel.findWithConditions(conditions);
    const roads = result.roads;

    // 生成质量报告
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
          if (!r.last_inspection) return true;
          const daysSinceInspection = (Date.now() - new Date(r.last_inspection).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceInspection > 365; // 超过一年未检查
        }).length,
      roadsByType: roads.reduce((acc, road) => {
        if (road.road_type) {
          acc[road.road_type] = (acc[road.road_type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    this.success(res, report);
    return;
  });
}