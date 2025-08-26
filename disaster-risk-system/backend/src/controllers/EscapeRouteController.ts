import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { EscapeRouteModel, CreateEscapeRouteData, UpdateEscapeRouteData, EscapeRouteQuery } from '../models/EscapeRouteModel';
import { asyncHandler } from '../middleware/asyncHandler';
import { Point, EscapeRoute } from '../types';

export class EscapeRouteController extends BaseController {
  private escapeRouteModel: EscapeRouteModel;

  constructor() {
    super();
    this.escapeRouteModel = new EscapeRouteModel();
  }

  /**
   * 创建逃生路径
   */
  createRoute = asyncHandler(async (req: Request, res: Response) => {
    const {
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
      last_verified_date,
      verification_status
    } = req.body;

    // 验证必填字段
    if (!route_geometry) {
      return this.error(res, '路径几何信息是必填的', 400);
    }

    const routeData: CreateEscapeRouteData = {
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

  /**
   * 获取逃生路径列表
   */
  getRoutes = asyncHandler(async (req: Request, res: Response) => {
    const {
      difficulty_level,
      verification_status,
      min_safety_score,
      max_distance,
      page = 1,
      limit = 20,
      route_id
    } = req.query;

    const conditions: EscapeRouteQuery = {
      difficulty_level: difficulty_level ? parseInt(difficulty_level as string) : undefined,
      verification_status: verification_status as string,
      min_safety_score: min_safety_score ? parseFloat(min_safety_score as string) : undefined,
      max_distance: max_distance ? parseFloat(max_distance as string) : undefined,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      route_id: route_id ? String(route_id) : undefined
    };

    const result = await this.escapeRouteModel.findWithConditions(conditions);
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const totalPages = Math.ceil(result.total / limitNum);
    
    this.paginated(res, result.routes, {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      pages: totalPages
    });
    return;
  });

  /**
   * 根据ID获取逃生路径
   */
  getRouteById = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 根据路径ID获取逃生路径
   */
  getRouteByRouteId = asyncHandler(async (req: Request, res: Response) => {
    const { routeId } = req.params;

    const route = await this.escapeRouteModel.findByRouteId(routeId);
    
    if (!route) {
      return this.notFound(res, '逃生路径不存在');
    }

    this.success(res, route);
    return;
  });

  /**
   * 查找从指定点出发的逃生路径
   */
  getRoutesFromPoint = asyncHandler(async (req: Request, res: Response) => {
    const { lng, lat, maxDistance = 5000 } = req.query;

    if (!lng || !lat) {
      return this.error(res, '经纬度参数是必填的', 400);
    }

    const point: Point = {
      type: 'Point',
      coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
    };

    const routes = await this.escapeRouteModel.findFromPoint(
      point,
      parseInt(maxDistance as string)
    );

    this.success(res, routes);
    return;
  });

  /**
   * 查找到指定避难场所的逃生路径
   */
  getRoutesToShelter = asyncHandler(async (req: Request, res: Response) => {
    const { lng, lat, maxDistance = 10000 } = req.query;

    if (!lng || !lat) {
      return this.error(res, '经纬度参数是必填的', 400);
    }

    const shelterPoint: Point = {
      type: 'Point',
      coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
    };

    const routes = await this.escapeRouteModel.findToShelter(
      shelterPoint,
      parseInt(maxDistance as string)
    );

    this.success(res, routes);
    return;
  });

  /**
   * 查找指定区域内的逃生路径
   */
  getRoutesInArea = asyncHandler(async (req: Request, res: Response) => {
    const { minLng, minLat, maxLng, maxLat } = req.query;

    if (!minLng || !minLat || !maxLng || !maxLat) {
      return this.error(res, '区域边界参数是必填的', 400);
    }

    const bounds = {
      minLng: parseFloat(minLng as string),
      minLat: parseFloat(minLat as string),
      maxLng: parseFloat(maxLng as string),
      maxLat: parseFloat(maxLat as string)
    };

    const routes = await this.escapeRouteModel.findInArea(bounds);
    this.success(res, routes);
    return;
  });

  /**
   * 更新逃生路径
   */
  updateRoute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return this.error(res, '无效的路径ID', 400);
    }

    const {
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
      last_verified_date,
      verification_status
    } = req.body;

    const updateData: UpdateEscapeRouteData = {
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

  /**
   * 验证逃生路径
   */
  verifyRoute = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 删除逃生路径
   */
  deleteRoute = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 获取逃生路径统计信息
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.escapeRouteModel.getStatistics();
    this.success(res, statistics);
    return;
  });

  /**
   * 批量导入逃生路径
   */
  batchImport = asyncHandler(async (req: Request, res: Response) => {
    const { routes } = req.body;

    if (!Array.isArray(routes) || routes.length === 0) {
      return this.error(res, '路径数据不能为空', 400);
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < routes.length; i++) {
      try {
        const routeData = routes[i] as CreateEscapeRouteData;
        
        // 验证必填字段
        if (!routeData.route_geometry) {
          errors.push({ index: i, error: '路径几何信息是必填的' });
          continue;
        }

        const route = await this.escapeRouteModel.create(routeData);
        results.push(route);
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
      routes: results,
      errors
    }, `成功导入 ${results.length} 条逃生路径`);
    return;
  });

  /**
   * 获取路径推荐
   */
  getRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const { 
      startLng, 
      startLat, 
      endLng, 
      endLat, 
      maxDistance = 10000,
      minSafetyScore = 0.5
    } = req.query;

    if (!startLng || !startLat) {
      return this.error(res, '起点坐标是必填的', 400);
    }

    const startPoint: Point = {
      type: 'Point',
      coordinates: [parseFloat(startLng as string), parseFloat(startLat as string)]
    };

    let routes;
    
    if (endLng && endLat) {
      // 如果有终点，查找到终点的路径
      const endPoint: Point = {
        type: 'Point',
        coordinates: [parseFloat(endLng as string), parseFloat(endLat as string)]
      };
      routes = await this.escapeRouteModel.findToShelter(
        endPoint,
        parseInt(maxDistance as string)
      );
    } else {
      // 否则查找从起点出发的路径
      routes = await this.escapeRouteModel.findFromPoint(
        startPoint,
        parseInt(maxDistance as string)
      );
    }

    // 过滤安全评分
    const filteredRoutes = routes.filter(route => 
      (route.safety_score || 0) >= parseFloat(minSafetyScore as string)
    );

    // 按安全评分和距离排序
    const sortedRoutes = filteredRoutes.sort((a, b) => {
      const scoreA = a.safety_score || 0;
      const scoreB = b.safety_score || 0;
      const distanceA = a.distance_meters || Infinity;
      const distanceB = b.distance_meters || Infinity;
      
      // 首先按安全评分降序
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // 然后按距离升序
      return distanceA - distanceB;
    });

    this.success(res, {
      total: sortedRoutes.length,
      routes: sortedRoutes.slice(0, 10), // 返回前10个推荐路径
      criteria: {
        maxDistance: parseInt(maxDistance as string),
        minSafetyScore: parseFloat(minSafetyScore as string)
      }
    });
    return;
  });
}