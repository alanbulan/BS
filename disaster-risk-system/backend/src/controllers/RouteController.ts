import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RouteCalculationService, RouteOptions } from '../services/RouteCalculationService';
import { Point } from '../types';
import { pool } from '../config/database';

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

      // 如果用户已登录，保存路径到数据库
      if (req.user?.id) {
        const saveToDb = req.body.saveToDatabase !== false; // 默认保存
        if (saveToDb) {
          try {
            console.log(`[SAVE] 尝试保存用户 ${req.user.username}(ID:${req.user.id}) 的路径...`);
            const saved = await this.routeService.saveUserRoute(result.route, req.user.id, req.user.username);
            console.log(`[SAVE] 路径已保存，数据库ID: ${saved.id}`);
          } catch (saveError: any) {
            console.error('[ERROR] 保存路径失败:', saveError.message, saveError.stack);
            // 不影响主流程，只记录错误
          }
        } else {
          console.log('[SAVE] 用户选择不保存路径');
        }
      } else {
        console.log('[SAVE] 用户未登录，跳过保存');
      }

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

      // 查询数据库获取最近的避难场所
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
        LIMIT $3
      `;
      
      const result = await pool.query(query, [
        parseFloat(longitude as string),
        parseFloat(latitude as string),
        parseInt(limit as string)
      ]);
      
      const shelters = result.rows;
      
      this.success(res, shelters, '获取避难场所成功');
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

      // 从数据库查询路径详情
      const query = `
        SELECT *,
          ST_AsGeoJSON(start_point)::json as start_point,
          ST_AsGeoJSON(end_point)::json as end_point,
          ST_AsGeoJSON(route_geometry)::json as route_geometry
        FROM escape_routes
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [parseInt(routeId)]);
      
      if (result.rows.length === 0) {
        this.notFound(res, '路径不存在');
        return;
      }
      
      const routeDetails = result.rows[0];

      this.success(res, routeDetails, '获取路径详情成功');
    } catch (error) {
      console.error('获取路径详情失败:', error);
      this.error(res, '获取路径详情失败: ' + (error as Error).message, 500);
    }
    return;
  };
}