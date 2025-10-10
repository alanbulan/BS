import { Request, Response } from 'express'
import { BaseController } from './BaseController'
import { UserReportModel } from '../models/UserReportModel'
import { DisasterTypeModel } from '../models/DisasterTypeModel'
import { Point, UserReport, LocationQuery } from '../types'
import { 
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  VERIFICATION_STATUSES,
  VERIFICATION_STATUS_LABELS,
  SEVERITY_LEVELS,
  SEVERITY_LEVEL_LABELS
} from '../utils'
import { getFileInfo } from '../middleware/upload'

export class UserReportController extends BaseController {
  private userReportModel: UserReportModel
  private disasterTypeModel: DisasterTypeModel

  constructor() {
    super()
    this.userReportModel = new UserReportModel()
    this.disasterTypeModel = new DisasterTypeModel()
  }

  /**
   * 获取用户报告列表
   */
  getUserReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req);
      
      const {
        user_id,
        report_type,
        disaster_type_id,
        verification_status,
        min_severity,
        max_severity,
        is_emergency,
        start_date,
        end_date,
        search
      } = req.query;

      // 构建查询条件
      const conditions: any = {};
      if (user_id) conditions.user_id = parseInt(user_id as string);
      if (report_type) conditions.report_type = report_type;
      if (disaster_type_id) conditions.disaster_type_id = parseInt(disaster_type_id as string);
      if (verification_status) conditions.verification_status = verification_status;
      if (min_severity) conditions.min_severity = parseInt(min_severity as string);
      if (max_severity) conditions.max_severity = parseInt(max_severity as string);
      if (is_emergency !== undefined) conditions.is_emergency = is_emergency === 'true';
      if (start_date) conditions.start_date = new Date(start_date as string);
      if (end_date) conditions.end_date = new Date(end_date as string);
      if (search) conditions.search = search as string;

      const result = await this.userReportModel.findWithPagination({
        conditions,
        pagination: { page, limit, offset },
        sort: { field: sortBy, order: sortOrder as 'ASC' | 'DESC' }
      });

      this.paginated(res, result.data, result.pagination);
    } catch (error) {
      console.error('获取用户报告列表失败:', error);
      this.error(res, '获取用户报告列表失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取“我的报告”列表（当前登录用户）
   */
  getMyReports = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        this.error(res, '需要登录', 401)
        return
      }
      const { page, limit, offset } = this.getPaginationParams(req)
      const { sortBy, sortOrder } = this.getSortParams(req)
      const { report_type, disaster_type_id, verification_status, min_severity, max_severity, is_emergency, start_date, end_date, search } = req.query
      const conditions: any = { user_id: req.user.id }
      if (report_type) conditions.report_type = report_type
      if (disaster_type_id) conditions.disaster_type_id = parseInt(disaster_type_id as string)
      if (verification_status) conditions.verification_status = verification_status
      if (min_severity) conditions.min_severity = parseInt(min_severity as string)
      if (max_severity) conditions.max_severity = parseInt(max_severity as string)
      if (is_emergency !== undefined) conditions.is_emergency = is_emergency === 'true'
      if (start_date) conditions.start_date = new Date(start_date as string)
      if (end_date) conditions.end_date = new Date(end_date as string)
      if (search) conditions.search = search as string
      const result = await this.userReportModel.findWithPagination({
        conditions,
        pagination: { page, limit, offset },
        sort: { field: sortBy, order: sortOrder as 'ASC' | 'DESC' }
      })
      this.paginated(res, result.data, result.pagination)
    } catch (error) {
      console.error('获取我的报告失败:', error)
      this.error(res, '获取我的报告失败: ' + (error as Error).message, 500)
    }
  }

  /**
   * 获取用户报告详情
   */
  getUserReportById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        this.error(res, '报告ID不能为空', 400);
        return;
      }

      const report = await this.userReportModel.findById(parseInt(id));
      if (!report) {
        this.notFound(res, '用户报告不存在');
        return;
      }

      this.success(res, report, '获取用户报告详情成功');
    } catch (error) {
      console.error('获取用户报告详情失败:', error);
      this.error(res, '获取用户报告详情失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 创建用户报告
   * - 绑定 req.user.id 为 user_id
   * - 支持 multipart/form-data，接收 images[]/videos[] 文件
   * - 兼容无文件的纯 JSON 提交
   */
  createUserReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        this.error(res, '需要登录', 401)
        return
      }
      const validation = this.validateRequired(req.body, ['report_type'])
      if (validation) {
        this.error(res, validation, 400)
        return
      }
      const allowedReportTypes = Object.values(REPORT_TYPES) as string[]
      const bodyReportType = String((req.body as any).report_type || '').trim()
      if (!allowedReportTypes.includes(bodyReportType)) {
        this.error(res, 'report_type 无效', 400)
        return
      }
      const parseLocation = (): Point | undefined => {
        const raw = (req.body as any).location
        if (raw) {
          try {
            const loc = typeof raw === 'string' ? JSON.parse(raw) : raw
            if (loc && loc.type === 'Point' && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
              const lon = parseFloat(loc.coordinates[0])
              const lat = parseFloat(loc.coordinates[1])
              if (!isNaN(lon) && !isNaN(lat)) return { type: 'Point', coordinates: [lon, lat] }
            }
          } catch {}
        }
        const lonKeys = ['longitude', 'lon', 'lng']
        const latKeys = ['latitude', 'lat']
        let lonStr: string | undefined
        let latStr: string | undefined
        for (const k of lonKeys) if ((req.body as any)[k] !== undefined) { lonStr = (req.body as any)[k]; break }
        for (const k of latKeys) if ((req.body as any)[k] !== undefined) { latStr = (req.body as any)[k]; break }
        if (lonStr !== undefined && latStr !== undefined) {
          const lon = parseFloat(String(lonStr))
          const lat = parseFloat(String(latStr))
          if (!isNaN(lon) && !isNaN(lat)) return { type: 'Point', coordinates: [lon, lat] }
        }
        return undefined
      }
      const location = parseLocation()
      const files = req.files as undefined | Record<string, Express.Multer.File[]>
      const uploadedImageUrls = files?.images?.map(f => getFileInfo(f).url) ?? []
      const uploadedVideoUrls = files?.videos?.map(f => getFileInfo(f).url) ?? []
      const parseArray = (val: any): string[] => {
        if (!val) return []
        if (Array.isArray(val)) return val.map(String)
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val)
            if (Array.isArray(parsed)) return parsed.map(String)
          } catch {}
          return val.split(',').map((s: string) => s.trim()).filter(Boolean)
        }
        return []
      }
      const bodyImageUrls = parseArray((req.body as any).images)
      const bodyVideoUrls = parseArray((req.body as any).videos)
      const images = [...bodyImageUrls, ...uploadedImageUrls]
      const videos = [...bodyVideoUrls, ...uploadedVideoUrls]
      const severityRaw = (req.body as any).severity ?? 3
      const severity = parseInt(String(severityRaw), 10)
      if (isNaN(severity) || severity < 1 || severity > 5) {
        this.error(res, '严重程度必须在1-5之间', 400)
        return
      }
      const is_emergency = String((req.body as any).is_emergency ?? 'false').toLowerCase() === 'true'
      const disaster_type_id = (req.body as any).disaster_type_id ? parseInt(String((req.body as any).disaster_type_id), 10) : undefined
      if (disaster_type_id !== undefined) {
        const type = await this.disasterTypeModel.findById(disaster_type_id)
        if (!type) {
          this.error(res, '灾害类型不存在', 400)
          return
        }
      }
      const reportData = {
        user_id: req.user.id,
        location,
        report_type: bodyReportType,
        disaster_type_id,
        title: (req.body as any).title,
        description: (req.body as any).description,
        severity,
        images: images.length ? images : undefined,
        videos: videos.length ? videos : undefined,
        verification_status: 'pending',
        is_emergency
      } as Omit<UserReport, 'id' | 'created_at' | 'updated_at'>
      const result = await this.userReportModel.create(reportData)
      this.created(res, result, '创建用户报告成功')
    } catch (error) {
      console.error('创建用户报告失败:', error)
      this.error(res, '创建用户报告失败: ' + (error as Error).message, 500)
    }
  };

  /**
   * 验证用户报告
   */
  verifyUserReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { verification_status, verified_by, verification_notes } = req.body;

      if (!id) {
        this.error(res, '报告ID不能为空', 400);
        return;
      }

      if (!verification_status || !verified_by) {
        this.error(res, '验证状态和验证人ID不能为空', 400);
        return;
      }

      if (!['verified', 'rejected', 'pending'].includes(verification_status)) {
        this.error(res, '验证状态无效，必须是verified、rejected或pending', 400);
        return;
      }

      const result = await this.userReportModel.verifyReport(parseInt(id), {
        verification_status,
        verified_by,
        verification_notes
      });

      if (!result) {
        this.notFound(res, '用户报告不存在');
        return;
      }

      this.success(res, result, '验证用户报告成功');
    } catch (error) {
      console.error('验证用户报告失败:', error);
      this.error(res, '验证用户报告失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 更新用户报告投票
   */
  updateVotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { vote_type } = req.body;

      if (!id) {
        this.error(res, '报告ID不能为空', 400);
        return;
      }

      if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
        this.error(res, '投票类型无效，必须是upvote或downvote', 400);
        return;
      }

      const result = await this.userReportModel.updateVotes(parseInt(id), vote_type);
      if (!result) {
        this.notFound(res, '用户报告不存在');
        return;
      }

      this.success(res, result, '更新投票成功');
    } catch (error) {
      console.error('更新投票失败:', error);
      this.error(res, '更新投票失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取附近的用户报告
   */
  getNearbyReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, radius = 5000, report_type, max_age_hours = 24, min_severity = 1, limit = 10 } = req.query;

      if (!latitude || !longitude) {
        this.error(res, '经纬度参数不能为空', 400);
        return;
      }

      const location: LocationQuery = {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radius: parseFloat(radius as string)
      };

      const options = {
        report_type: report_type as string,
        max_age_hours: parseInt(max_age_hours as string),
        min_severity: parseInt(min_severity as string),
        limit: parseInt(limit as string)
      };

      const reports = await this.userReportModel.findNearby(location, options);
      this.success(res, reports, '获取附近用户报告成功');
    } catch (error) {
      console.error('获取附近用户报告失败:', error);
      this.error(res, '获取附近用户报告失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取报告类型统计
   */
  getReportTypeStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.userReportModel.getReportTypeStats();
      this.success(res, stats, '获取报告类型统计成功');
    } catch (error) {
      console.error('获取报告类型统计失败:', error);
      this.error(res, '获取报告类型统计失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取最近的紧急报告
   */
  getRecentEmergencyReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hours = 24, limit = 10 } = req.query;
      
      const reports = await this.userReportModel.getRecentEmergencyReports(
        parseInt(hours as string),
        parseInt(limit as string)
      );
      
      this.success(res, reports, '获取最近紧急报告成功');
    } catch (error) {
      console.error('获取最近紧急报告失败:', error);
      this.error(res, '获取最近紧急报告失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取报告类型列表
   */
  getReportTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const types = await this.userReportModel.getReportTypes();
      this.success(res, types, '获取报告类型列表成功');
    } catch (error) {
      console.error('获取报告类型列表失败:', error);
      this.error(res, '获取报告类型列表失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取与用户报告相关的枚举常量
   * 返回内容包含：
   * - reportTypes: 报告类型枚举对象
   * - reportTypeLabels: 报告类型中文标签映射
   * - verificationStatuses: 验证状态枚举对象（与 user_reports.verification_status 字段对应）
   * - verificationStatusLabels: 验证状态中文标签映射
   * - severityLevels: 严重程度可选值数组（1-5）
   * - severityLevelLabels: 严重程度中文标签映射
   */
  getReportConstants = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = {
        reportTypes: REPORT_TYPES,
        reportTypeLabels: REPORT_TYPE_LABELS,
        verificationStatuses: VERIFICATION_STATUSES,
        verificationStatusLabels: VERIFICATION_STATUS_LABELS,
        severityLevels: SEVERITY_LEVELS,
        severityLevelLabels: SEVERITY_LEVEL_LABELS
      }
      this.success(res, data, '获取报告常量成功')
    } catch (error) {
      console.error('获取报告常量失败:', error)
      this.error(res, '获取报告常量失败: ' + (error as Error).message, 500)
    }
  }

  /**
   * 删除用户报告
   */
  deleteUserReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        this.error(res, '报告ID不能为空', 400);
        return;
      }

      const result = await this.userReportModel.delete(parseInt(id));
      if (!result) {
        this.notFound(res, '用户报告不存在');
        return;
      }

      this.success(res, null, '删除用户报告成功');
    } catch (error) {
      console.error('删除用户报告失败:', error);
      this.error(res, '删除用户报告失败: ' + (error as Error).message, 500);
    }
  };
}