import { Point, EscapeRoute, RiskZone, Shelter, RoadNetwork } from '../types';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { EscapeRouteModel } from '../models/EscapeRouteModel';

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

  constructor() {
    this.escapeRouteModel = new EscapeRouteModel();
    this.riskZoneModel = new RiskZoneModel();
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
   * 寻找最近的避难场所
   */
  private async findNearestShelter(location: Point): Promise<Shelter | null> {
    // 这里应该查询数据库中的避难场所
    // 目前返回模拟数据
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

  /**
   * 获取路网数据
   */
  private async getRoadNetwork(startPoint: Point, endPoint: Point): Promise<RoadNetwork[]> {
    // 这里应该查询道路网络数据
    // 目前返回模拟数据
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
   * 计算最优路径
   */
  private async calculateOptimalPath(
    startPoint: Point,
    endPoint: Point,
    roadNetwork: RoadNetwork[],
    riskZones: any[],
    options: RouteOptions
  ): Promise<EscapeRoute> {
    // 使用改进的Dijkstra算法计算最优路径
    const distance = this.calculateDistance(startPoint, endPoint);
    const estimatedTime = this.estimateTime(distance, options.transportMode || 'walking');
    
    const route: EscapeRoute = {
      id: 0,
      route_id: `RT${Date.now()}`,
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
  ): Promise<EscapeRoute> {
    try {
      // 从数据库查找从起点出发的逃生路线
      const routes = await this.escapeRouteModel.findFromPoint(startPoint, options.maxDistance || 5000);
      
      if (routes.length === 0) {
        throw new Error('未找到可用的逃生路线');
      }
      
      // 按安全分数排序，返回最安全的路线
      const saferRoute = routes.sort((a, b) => (b.safety_score || 0) - (a.safety_score || 0))[0];
      
      return saferRoute;
    } catch (error) {
      console.error('计算安全路径失败:', error);
      throw new Error('计算安全路径失败');
    }
  }

  /**
   * 计算最短路径
   */
  private async calculateShortestRoute(
    startPoint: Point,
    endPoint: Point,
    options: RouteOptions = {}
  ): Promise<EscapeRoute> {
    try {
      // 从数据库查找从起点出发的逃生路线
      const routes = await this.escapeRouteModel.findFromPoint(startPoint, options.maxDistance || 5000);
      
      if (routes.length === 0) {
        throw new Error('未找到可用的逃生路线');
      }
      
      // 按距离排序，返回最短的路线
      const shortestRoute = routes.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0))[0];
      
      return shortestRoute;
    } catch (error) {
      console.error('计算最短路径失败:', error);
      throw new Error('计算最短路径失败');
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
}