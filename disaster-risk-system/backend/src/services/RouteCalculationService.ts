import { Point, EscapeRoute, RiskZone, Shelter, RoadNetwork } from '../types';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { EscapeRouteModel } from '../models/EscapeRouteModel';
import { RoadNetworkModel } from '../models/RoadNetworkModel';
import { AStarPathfinder, PathfindingOptions, PathResult } from '../utils/pathfinding/AStarPathfinder';

export interface RouteOptions {
  endPoint?: Point;
  avoidHighRiskZones?: boolean;
  maxDistance?: number; // 最大距离(公里)
  routeType?: 'fastest' | 'safest' | 'shortest';
  transportMode?: 'walking' | 'driving' | 'cycling';
}

export interface RouteResult {
  route: EscapeRoute;
  alternativeRoutes?: EscapeRoute[];
  warnings?: string[];
  estimatedTime: number; // 分钟
  totalDistance: number; // 米
  safetyScore: number; // 1-5分，5分最安全
}

export class RouteCalculationService {
  private escapeRouteModel: EscapeRouteModel;
  private riskZoneModel: RiskZoneModel;
  private roadNetworkModel: RoadNetworkModel;

  constructor() {
    this.escapeRouteModel = new EscapeRouteModel();
    this.riskZoneModel = new RiskZoneModel();
    this.roadNetworkModel = new RoadNetworkModel();
  }

  /**
   * 计算最优逃生路径
   */
  async calculateEscapeRoute(startPoint: Point, options: RouteOptions = {}): Promise<RouteResult> {
    try {
      // 如果没有指定终点，自动寻找最近的避难场所
      let targetPoint = options.endPoint;
      if (!targetPoint) {
        const nearestShelter = await this.findNearestShelter(startPoint);
        if (!nearestShelter || !nearestShelter.location) {
          throw new Error('附近没有找到可用的避难场所');
        }
        targetPoint = nearestShelter.location;
      }

      // 获取路网数据
      const roadNetwork = await this.getRoadNetwork(startPoint, targetPoint);
      
      // 获取风险区域信息
      const riskZones = await this.getRiskZonesAlongRoute(startPoint, targetPoint);
      
      // 计算主要路径
      const mainRoute = await this.calculateOptimalPath(
        startPoint,
        targetPoint,
        roadNetwork,
        riskZones,
        options
      );

      // 计算备选路径
      const alternativeRoutes = await this.calculateAlternativeRoutes(
        startPoint,
        targetPoint,
        roadNetwork,
        riskZones,
        options,
        mainRoute
      );

      // 评估路径安全性
      const safetyScore = this.calculateRouteSafety(mainRoute, riskZones);
      
      // 生成警告信息
      const warnings = this.generateRouteWarnings(mainRoute, riskZones);

      return {
        route: mainRoute,
        alternativeRoutes,
        warnings,
        estimatedTime: mainRoute.estimated_time_minutes || 0,
        totalDistance: mainRoute.distance_meters || 0,
        safetyScore
      };

    } catch (error) {
      console.error('路径计算失败:', error);
      throw error;
    }
  }

  /**
   * 寻找最近的避难场所（从数据库查询）
   */
  private async findNearestShelter(location: Point): Promise<Shelter | null> {
    try {
      // 查询数据库中最近的活跃避难所
      const query = `
        SELECT *,
          ST_AsGeoJSON(location)::json as location,
          ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) as distance
        FROM shelters
        WHERE is_active = true
        ORDER BY distance
        LIMIT 1
      `;
      
      const result = await this.escapeRouteModel['executeQuery'](query, [
        location.coordinates[0],
        location.coordinates[1]
      ]);
      
      if (result.rows.length === 0) {
        console.log('未找到活跃避难所');
        return null;
      }
      
      const shelter = result.rows[0];
      console.log(`找到最近避难所: ${shelter.name}, 距离: ${(shelter.distance / 1000).toFixed(2)}公里`);
      
      return shelter;
    } catch (error) {
      console.error('查询避难所失败:', error);
      return null;
    }
  }

  /**
   * 获取路网数据（从数据库查询真实道路）
   */
  private async getRoadNetwork(startPoint: Point, endPoint: Point): Promise<RoadNetwork[]> {
    try {
      console.log('正在查询数据库道路网络...');
      
      // 使用RoadNetworkModel查询起点和终点之间的道路
      const roads = await this.roadNetworkModel.findRoadsBetweenPoints(
        startPoint,
        endPoint,
        5 // 缓冲区5公里
      );
      
      console.log(`从数据库获取 ${roads.length} 条道路`);
      
      if (roads.length === 0) {
        console.warn('数据库中没有找到道路数据，使用模拟道路');
        // 降级：返回一条简单的模拟道路
        return [{
          id: 0,
          road_id: 'FALLBACK_001',
          road_name: '临时路径',
          geometry: {
            type: 'LineString',
            coordinates: [
              startPoint.coordinates,
              endPoint.coordinates
            ]
          },
          road_type: 'primary',
          is_emergency_route: true,
          created_at: new Date(),
          updated_at: new Date()
        } as RoadNetwork];
      }
      
      return roads;
    } catch (error) {
      console.error('查询道路网络失败:', error);
      // 降级方案
      return [{
        id: 0,
        road_id: 'FALLBACK_001',
        road_name: '临时路径',
        geometry: {
          type: 'LineString',
          coordinates: [startPoint.coordinates, endPoint.coordinates]
        },
        road_type: 'primary',
        is_emergency_route: true,
        created_at: new Date(),
        updated_at: new Date()
      } as RoadNetwork];
    }
  }

  /**
   * 获取路径沿线的风险区域
   */
  private async getRiskZonesAlongRoute(startPoint: Point, endPoint: Point): Promise<RiskZone[]> {
    try {
      // 计算路径中点
      const midPoint: Point = {
        type: 'Point',
        coordinates: [
          (startPoint.coordinates[0] + endPoint.coordinates[0]) / 2,
          (startPoint.coordinates[1] + endPoint.coordinates[1]) / 2
        ]
      };

      // 计算搜索半径（基于起点和终点的距离）
      const distance = Math.sqrt(
        Math.pow(endPoint.coordinates[0] - startPoint.coordinates[0], 2) +
        Math.pow(endPoint.coordinates[1] - startPoint.coordinates[1], 2)
      ) * 111.32; // 转换为公里
      
      const searchRadius = Math.max(distance / 2 + 5, 10); // 至少10公里搜索半径

      // 查询中点附近的风险区域
      const riskZones = await this.riskZoneModel.findNearbyZones(midPoint, searchRadius);
      
      return riskZones;
    } catch (error) {
      console.error('获取风险区域失败:', error);
      return [];
    }
  }

  /**
   * 计算最优路径（使用A*算法）
   */
  private async calculateOptimalPath(
    startPoint: Point,
    endPoint: Point,
    roadNetwork: RoadNetwork[],
    riskZones: any[],
    options: RouteOptions
  ): Promise<EscapeRoute> {
    console.log('使用A*算法计算最优路径...');

    try {
      // 构建路网图
      const graph = AStarPathfinder.buildGraphFromRoads(roadNetwork);
      
      if (graph.size === 0) {
        console.warn('路网图为空，使用直线路径');
        return this.createDirectRoute(startPoint, endPoint, riskZones, options);
      }

      // 配置A*算法参数
      const pathfindingOptions: PathfindingOptions = {
        routeType: options.routeType || 'safest',
        avoidHighRiskZones: options.avoidHighRiskZones !== false,
        riskWeightFactor: 0.7, // 风险权重因子
        maxDistance: options.maxDistance ? options.maxDistance * 1000 : undefined
      };

      // 执行A*搜索
      const pathfinder = new AStarPathfinder(graph, riskZones, pathfindingOptions);
      const pathResult: PathResult | null = pathfinder.findPath(startPoint, endPoint);

      if (!pathResult) {
        console.warn('A*算法未找到路径，使用直线路径');
        return this.createDirectRoute(startPoint, endPoint, riskZones, options);
      }

      console.log(`A*算法成功: ${pathResult.path.length}个路径点, 距离${pathResult.totalDistance}米`);

      // 将A*结果转换为EscapeRoute
      const route: EscapeRoute = {
        id: 0,
        route_id: `RT${Date.now()}`,
        start_point: startPoint,
        end_point: endPoint,
        route_geometry: {
          type: 'LineString' as const,
          coordinates: pathResult.path.map(p => p.coordinates)
        },
        distance_meters: pathResult.totalDistance,
        estimated_time_minutes: pathResult.estimatedTime,
        difficulty_level: this.calculateDifficulty(pathResult.totalDistance, riskZones.length),
        route_conditions: {
          road_type: options.routeType || 'mixed',
          traffic_condition: 'normal',
          weather_impact: 'none',
          risk_level: Math.max(1, Math.min(5, Math.round(pathResult.totalRisk * 5))),
          algorithm: 'A*',
          safety_score: pathResult.safetyScore
        },
        safety_score: pathResult.safetyScore,
        verification_status: 'system_verified',
        created_at: new Date(),
        updated_at: new Date()
      };

      return route;

    } catch (error) {
      console.error('A*算法执行失败:', error);
      return this.createDirectRoute(startPoint, endPoint, riskZones, options);
    }
  }

  /**
   * 创建直线路径（降级方案）
   */
  private createDirectRoute(
    startPoint: Point,
    endPoint: Point,
    riskZones: any[],
    options: RouteOptions
  ): EscapeRoute {
    const distance = this.calculateDistance(startPoint, endPoint);
    const estimatedTime = this.estimateTime(distance, options.transportMode || 'walking');
    
    const route: EscapeRoute = {
      id: 0,
      route_id: `RT${Date.now()}_DIRECT`,
      start_point: startPoint,
      end_point: endPoint,
      route_geometry: {
        type: 'LineString' as const,
        coordinates: [startPoint.coordinates, endPoint.coordinates]
      },
      distance_meters: distance,
      estimated_time_minutes: estimatedTime,
      difficulty_level: this.calculateDifficulty(distance, riskZones.length),
      route_conditions: {
        road_type: 'direct',
        traffic_condition: 'unknown',
        weather_impact: 'none',
        risk_level: riskZones.length > 0 ? 3 : 1,
        algorithm: 'direct_line'
      },
      verification_status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    route.safety_score = this.calculateRouteSafety(route, riskZones);
    return route;
  }

  /**
   * 计算备选路径
   */
  private async calculateAlternativeRoutes(
    startPoint: Point,
    endPoint: Point,
    roadNetwork: RoadNetwork[],
    riskZones: any[],
    options: RouteOptions,
    mainRoute: EscapeRoute
  ): Promise<EscapeRoute[]> {
    // 计算2-3条备选路径
    const alternatives: EscapeRoute[] = [];
    
    try {
      // 备选路径1：更安全但可能更远的路径
      const safeRoute = await this.calculateSaferRoute(startPoint, endPoint, riskZones, options);
      if (safeRoute && safeRoute.id !== mainRoute.id) {
        alternatives.push(safeRoute);
      }

      // 备选路径2：最短距离路径
      const shortestRoute = await this.calculateShortestRoute(startPoint, endPoint, options);
      if (shortestRoute && shortestRoute.id !== mainRoute.id) {
        alternatives.push(shortestRoute);
      }
    } catch (error) {
      console.error('计算备选路径失败（非致命错误）:', error);
      // 即使备选路径失败，主路径仍然可用
    }

    console.log(`找到 ${alternatives.length} 条备选路径`);
    return alternatives;
  }

  /**
   * 计算更安全的路径
   */
  private async calculateSaferRoute(
    startPoint: Point,
    endPoint: Point,
    riskZones: any[],
    options: RouteOptions = {}
  ): Promise<EscapeRoute | null> {
    try {
      // 从数据库查找从起点出发的逃生路线
      const routes = await this.escapeRouteModel.findFromPoint(startPoint, options.maxDistance || 5000);
      
      if (routes.length === 0) {
        console.log('数据库中没有备选路线，跳过');
        return null;
      }
      
      // 按安全分数排序，返回最安全的路线
      const saferRoute = routes.sort((a, b) => (b.safety_score || 0) - (a.safety_score || 0))[0];
      
      return saferRoute;
    } catch (error) {
      console.error('计算安全路径失败:', error);
      return null; // 返回null而不是抛出错误
    }
  }

  /**
   * 计算最短路径
   */
  private async calculateShortestRoute(
    startPoint: Point,
    endPoint: Point,
    options: RouteOptions = {}
  ): Promise<EscapeRoute | null> {
    try {
      // 从数据库查找从起点出发的逃生路线
      const routes = await this.escapeRouteModel.findFromPoint(startPoint, options.maxDistance || 5000);
      
      if (routes.length === 0) {
        console.log('数据库中没有路线数据，跳过最短路径计算');
        return null;
      }
      
      // 按距离排序，返回最短的路线
      const shortestRoute = routes.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0))[0];
      
      return shortestRoute;
    } catch (error) {
      console.error('计算最短路径失败:', error);
      return null; // 返回null而不是抛出错误
    }
  }

  /**
   * 计算两点间距离（米）
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const R = 6371000; // 地球半径（米）
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

  /**
   * 估算时间（分钟）
   */
  private estimateTime(distance: number, transportMode: string): number {
    const speeds = {
      walking: 5, // 5 km/h
      cycling: 15, // 15 km/h
      driving: 40 // 40 km/h (考虑城市道路和紧急情况)
    };

    const speed = speeds[transportMode as keyof typeof speeds] || speeds.walking;
    return Math.round((distance / 1000) / speed * 60); // 转换为分钟
  }

  /**
   * 计算路径难度
   */
  private calculateDifficulty(distance: number, riskZoneCount: number): number {
    let difficultyScore = 1;
    
    // 距离因素
    if (distance > 5000) difficultyScore += 1;
    if (distance > 10000) difficultyScore += 1;
    
    // 风险区域因素
    difficultyScore += Math.min(riskZoneCount, 2);
    
    return Math.min(difficultyScore, 5);
  }

  /**
   * 计算路径安全性评分
   */
  private calculateRouteSafety(route: EscapeRoute, riskZones: any[]): number {
    let safetyScore = 5; // 最高分5分
    
    // 根据风险区域数量扣分
    safetyScore -= Math.min(riskZones.length * 0.5, 2);
    
    // 根据路径条件扣分
    if (route.route_conditions && route.route_conditions.risk_level > 2) {
      safetyScore -= 1;
    }
    
    // 根据难度等级扣分
    if (route.difficulty_level && route.difficulty_level >= 4) {
      safetyScore -= 0.5;
    }
    
    return Math.max(safetyScore, 1);
  }

  /**
  /**
   * 生成路径警告信息
   */
  private generateRouteWarnings(route: EscapeRoute, riskZones: any[]): string[] {
    const warnings: string[] = [];
    
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

  /**
   * 实时更新路径状态
   */
  async updateRouteStatus(routeId: number, currentLocation: Point): Promise<{
    remainingDistance: number;
    remainingTime: number;
    nextInstruction: string;
    needsRerouting: boolean;
  }> {
    try {
      // 获取路径信息
      const route = await this.escapeRouteModel.findById(routeId);
      if (!route) {
        throw new Error('路径不存在');
      }

      // 计算当前位置到终点的距离（优先使用 end_point，若为空则使用 route_geometry 的最后一个点）
      let endPoint: Point | null = null;
      if (route.end_point) {
        endPoint = {
          type: 'Point',
          coordinates: [route.end_point.coordinates[0], route.end_point.coordinates[1]]
        };
      } else if (route.route_geometry?.coordinates?.length) {
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

      // 估算剩余时间
      const remainingTime = this.estimateTime(remainingDistance, 'walking');

      // 生成下一步指令
      const nextInstruction = this.generateNextInstruction(currentLocation, route);

      // 检查是否需要重新规划
      const needsRerouting = await this.checkForRerouting(routeId, currentLocation);

      return {
        remainingDistance: Math.round(remainingDistance),
        remainingTime: Math.round(remainingTime),
        nextInstruction,
        needsRerouting
      };
    } catch (error) {
      console.error('更新路径状态失败:', error);
      return {
        remainingDistance: 0,
        remainingTime: 0,
        nextInstruction: '无法获取路径信息',
        needsRerouting: true
      };
    }
  }

  /**
   * 生成下一步指令
   */
  private generateNextInstruction(currentLocation: Point, route: EscapeRoute): string {
    try {
      // 解析路径点（来自 route_geometry）
      const pathPoints = route.route_geometry?.coordinates || [];
      if (pathPoints.length === 0) {
        return '继续前往目的地';
      }

      // 找到最近的路径点
      let nearestPointIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < pathPoints.length; i++) {
        const point: Point = {
          type: 'Point',
          coordinates: [pathPoints[i][0], pathPoints[i][1]]
        };
        const distance = this.calculateDistance(currentLocation, point);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPointIndex = i;
        }
      }

      // 获取下一个路径点
      const nextPointIndex = Math.min(nearestPointIndex + 1, pathPoints.length - 1);
      const nextPoint: Point = {
        type: 'Point',
        coordinates: [pathPoints[nextPointIndex][0], pathPoints[nextPointIndex][1]]
      };
      
      const distanceToNext = this.calculateDistance(currentLocation, nextPoint);
      
      if (distanceToNext < 50) {
        return '即将到达目的地';
      } else if (distanceToNext < 200) {
        return `继续前行${Math.round(distanceToNext)}米`;
      } else {
        return `直行${Math.round(distanceToNext)}米`;
      }
    } catch (error) {
      console.error('生成指令失败:', error);
      return '继续前往目的地';
    }
  }

  /**
   * 检查是否需要重新规划路径
   */
  async checkForRerouting(routeId: number, currentLocation: Point): Promise<boolean> {
    try {
      // 获取路径信息
      const route = await this.escapeRouteModel.findById(routeId);
      if (!route) {
        return true; // 路径不存在，需要重新规划
      }

      // 检查路径上的风险区域（优先使用 end_point，若为空则使用 route_geometry 的最后一个点）
      let endPoint: Point | null = null;
      if (route.end_point) {
        endPoint = {
          type: 'Point',
          coordinates: [route.end_point.coordinates[0], route.end_point.coordinates[1]]
        };
      } else if (route.route_geometry?.coordinates?.length) {
        const last = route.route_geometry.coordinates[route.route_geometry.coordinates.length - 1];
        endPoint = {
          type: 'Point',
          coordinates: [last[0], last[1]]
        };
      }
      if (!endPoint) {
        return true; // 缺少终点几何信息，建议重新规划
      }
      
      const currentRiskZones = await this.getRiskZonesAlongRoute(currentLocation, endPoint);
      
      // 检查是否有高风险区域
      const highRiskZones = currentRiskZones.filter(zone => (zone as any).current_risk_level >= 4);
      if (highRiskZones.length > 0) {
        return true; // 发现高风险区域，需要重新规划
      }

      // 检查当前位置是否偏离原路径太远
      const pathPoints = route.route_geometry?.coordinates || [];
      if (pathPoints.length > 0) {
        let minDistanceToPath = Infinity;
        
        for (const pathPoint of pathPoints) {
          const point: Point = {
            type: 'Point',
            coordinates: [pathPoint[0], pathPoint[1]]
          };
          const distance = this.calculateDistance(currentLocation, point);
          minDistanceToPath = Math.min(minDistanceToPath, distance);
        }
        
        // 如果偏离路径超过500米，建议重新规划
        if (minDistanceToPath > 500) {
          return true;
        }
      }

      return false; // 无需重新规划
    } catch (error) {
      console.error('检查重新规划失败:', error);
      return true; // 出错时建议重新规划
    }
  }

  /**
   * 保存用户计算的路径到数据库
   * 如果相同起点和终点的路径已存在，则更新；否则新建
   */
  async saveUserRoute(route: EscapeRoute, userId: number, username?: string): Promise<EscapeRoute> {
    try {
      // 1. 检查是否已有相同起点和终点的路径
      const existingRoute = await this.escapeRouteModel.findSimilarUserRoute(
        userId,
        route.start_point,
        route.end_point
      );
      
      if (existingRoute) {
        console.log(`找到相同起终点的路径 ID:${existingRoute.id}，将更新`);
        // 删除这条旧路径
        await this.escapeRouteModel.delete(existingRoute.id);
      } else {
        console.log(`新的起终点组合，创建新历史记录`);
      }

      // 2. 保存新路径
      const routeData = {
        ...route,
        user_id: userId,
        is_user_generated: true,
        created_by_name: username || `用户${userId}`,
        verification_status: 'system_verified' // 系统验证通过
      };

      // 使用escapeRouteModel创建记录
      const saved = await this.escapeRouteModel.create(routeData as any);
      console.log(`路径已保存，ID: ${saved.id}`);

      return saved;
    } catch (error) {
      console.error('保存用户路径失败:', error);
      throw new Error('保存路径失败');
    }
  }
}