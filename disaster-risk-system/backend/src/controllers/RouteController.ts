import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RouteCalculationService, RouteOptions } from '../services/RouteCalculationService';
import { Point } from '../types';

export class RouteController extends BaseController {
  private routeService: RouteCalculationService;

  constructor() {
    super();
    this.routeService = new RouteCalculationService();
  }

  /**
   * 计算逃生路径
   */
  calculateRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        startPoint,
        endPoint,
        avoidHighRiskZones = true,
        maxDistance = 50,
        routeType = 'safest',
        transportMode = 'walking'
      } = req.body;

      // 验证起点
      if (!startPoint || !startPoint.coordinates || startPoint.coordinates.length !== 2) {
      this.error(res, '起点坐标格式不正确', 400);
        return;
      }

      // 构建路径选项
      const options: RouteOptions = {
        endPoint: endPoint as Point,
        avoidHighRiskZones,
        maxDistance,
        routeType,
        transportMode
      };

      const result = await this.routeService.calculateEscapeRoute(startPoint as Point, options);

      this.success(res, result, '路径计算成功');
    } catch (error) {
      console.error('路径计算失败:', error);
      this.error(res, '路径计算失败: ' + (error as Error).message, 500);
    }
    return;
  };

  /**
   * 更新路径状态
   */
  updateRouteStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { routeId } = req.params;
      const { currentLocation } = req.body;

      if (!currentLocation || !currentLocation.coordinates) {
        this.error(res, '当前位置坐标不正确', 400);
        return;
      }

      const status = await this.routeService.updateRouteStatus(
        parseInt(routeId),
        currentLocation as Point
      );

      this.success(res, status, '路径状态更新成功');
    } catch (error) {
      console.error('路径状态更新失败:', error);
      this.error(res, '路径状态更新失败: ' + (error as Error).message, 500);
    }
    return;
  };

  /**
   * 检查是否需要重新规划路径
   */
  checkRerouting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { routeId } = req.params;
      const { currentLocation } = req.body;

      if (!currentLocation || !currentLocation.coordinates) {
        this.error(res, '当前位置坐标不正确', 400);
        return;
      }

      const needsRerouting = await this.routeService.checkForRerouting(
        parseInt(routeId),
        currentLocation as Point
      );

      this.success(res, { needsRerouting }, '重新规划检查完成');
    } catch (error) {
      console.error('重新规划检查失败:', error);
      this.error(res, '重新规划检查失败: ' + (error as Error).message, 500);
    }
    return;
  };

  /**
   * 获取最近的避难场所
   */
  getNearestShelters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, limit = 5 } = req.query;

      if (!latitude || !longitude) {
        this.error(res, '经纬度参数不能为空', 400);
        return;
      }

      // 这里应该查询数据库获取最近的避难场所
      // 目前返回模拟数据
      const shelters = [
        {
          id: 1,
          name: '市民广场避难场所',
          location: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string) + 0.01, parseFloat(latitude as string) + 0.01]
          },
          distance: 1200,
          capacity: 1000,
          current_occupancy: 150,
          facilities: {
            medical: true,
            food: true,
            water: true,
            communication: true
          }
        },
        {
          id: 2,
          name: '体育馆避难场所',
          location: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string) - 0.01, parseFloat(latitude as string) + 0.02]
          },
          distance: 1800,
          capacity: 2000,
          current_occupancy: 300,
          facilities: {
            medical: true,
            food: true,
            water: true,
            communication: true,
            parking: true
          }
        }
      ];

      this.success(res, shelters.slice(0, parseInt(limit as string)), '获取避难场所成功');
    } catch (error) {
      console.error('获取避难场所失败:', error);
      this.error(res, '获取避难场所失败: ' + (error as Error).message, 500);
    }
    return;
  };

  /**
   * 获取路径详情
   */
  getRouteDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { routeId } = req.params;

      // 这里应该从数据库查询路径详情
      // 目前返回模拟数据
      const routeDetails = {
        id: parseInt(routeId),
        route_id: `route_${routeId}`,
        start_point: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        end_point: {
          type: 'Point',
          coordinates: [116.4174, 39.9142]
        },
        route_geometry: {
          type: 'LineString',
          coordinates: [
            [116.4074, 39.9042],
            [116.4124, 39.9092],
            [116.4174, 39.9142]
          ]
        },
        distance_meters: 1500,
        estimated_time_minutes: 18,
        difficulty_level: 2,
        safety_score: 4.2,
        waypoints: [
          {
            coordinates: [116.4124, 39.9092],
            instruction: '右转进入主干道',
            distance_to_next: 750
          }
        ],
        warnings: [
          '路段可能有轻微拥堵，请预留额外时间'
        ],
        verification_status: 'verified',
        last_verified_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      this.success(res, routeDetails, '获取路径详情成功');
    } catch (error) {
      console.error('获取路径详情失败:', error);
      this.error(res, '获取路径详情失败: ' + (error as Error).message, 500);
    }
    return;
  };
}