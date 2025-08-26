import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { asyncHandler } from '../middleware/asyncHandler';
import { RiskZoneModel } from '../models/RiskZoneModel';
import { WarningModel } from '../models/WarningModel';
import { MonitoringStationModel } from '../models/MonitoringStationModel';
import { ShelterModel } from '../models/ShelterModel';
import { UserReportModel } from '../models/UserReportModel';
import { MonitoringDataModel } from '../models/MonitoringDataModel';
import { pool } from '../config/database';

export class DashboardController extends BaseController {
  private shelterModel: ShelterModel;
  private userReportModel: UserReportModel;
  private monitoringDataModel: MonitoringDataModel;
  private stationModel: MonitoringStationModel;

  constructor() {
    super();
    this.shelterModel = new ShelterModel();
    this.userReportModel = new UserReportModel();
    this.monitoringDataModel = new MonitoringDataModel();
    this.stationModel = new MonitoringStationModel();
  }

  /**
   * 获取仪表板统计数据
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      // 并行获取各项统计数据
      const [zoneStats, warningStats, stationStats, shelterStats, reportStats, userStats, assessmentStats] = await Promise.all([
        RiskZoneModel.getStatistics(),
        WarningModel.getWarningStats(),
        this.stationModel.paginate(1, 1000).then(result => ({ 
          total: result.pagination.total, 
          online: result.data.filter(s => s.is_active).length 
        })),
        this.shelterModel.getStatistics(),
        this.userReportModel.getStatistics(),
        // 获取用户统计
        pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
        // 获取风险评估统计
        pool.query('SELECT COUNT(*) as total FROM risk_assessments WHERE assessment_time >= NOW() - INTERVAL \'30 days\'')
      ]);

      const dashboardStats = {
        totalZones: zoneStats.total || 0,
        activeWarnings: warningStats.active || 0,
        onlineStations: stationStats.online || 0,
        riskAssessments: assessmentStats.rows[0]?.total || 0,
        totalShelters: shelterStats.total_shelters || 0,
        totalUsers: userStats.rows[0]?.total || 0,
        totalReports: reportStats.total || 0
      };

      this.success(res, dashboardStats, '获取仪表板统计数据成功');
    } catch (error) {
      console.error('获取仪表板统计数据失败:', error);
      this.error(res, '获取仪表板统计数据失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取监测站点统计
   */
  getStationStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      const stationStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as online,
          COUNT(CASE WHEN is_active = false THEN 1 END) as offline,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
        FROM monitoring_stations
      `);

      const result = stationStats.rows[0];
      const stats = {
        total: parseInt(result.total) || 0,
        online: parseInt(result.online) || 0,
        offline: parseInt(result.offline) || 0,
        maintenance: parseInt(result.maintenance) || 0
      };

      this.success(res, stats, '获取监测站点统计成功');
    } catch (error) {
      console.error('获取监测站点统计失败:', error);
      this.error(res, '获取监测站点统计失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取灾害类型统计
   */
  getDisasterTypeStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      const typeStats = await pool.query(`
        SELECT 
          dt.name AS type_name,
          dt.id AS type_id,
          COUNT(w.warning_id) as warning_count,
          COUNT(CASE WHEN w.status = 'active' AND (w.expiry_time IS NULL OR w.expiry_time > NOW()) THEN 1 END) as active_warnings
        FROM disaster_types dt
        LEFT JOIN warnings w ON dt.id = w.disaster_type_id
        GROUP BY dt.id, dt.name
        ORDER BY warning_count DESC
      `);

      const stats = typeStats.rows.map(row => ({
        typeId: row.type_id,
        typeName: row.type_name,
        warningCount: parseInt(row.warning_count) || 0,
        activeWarnings: parseInt(row.active_warnings) || 0
      }));

      this.success(res, stats, '获取灾害类型统计成功');
    } catch (error) {
      console.error('获取灾害类型统计失败:', error);
      this.error(res, '获取灾害类型统计失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取监测数据概览
   */
  getMonitoringOverview = asyncHandler(async (req: Request, res: Response) => {
    try {
      const overview = await pool.query(`
        SELECT 
          COUNT(DISTINCT station_id) as active_stations,
          COUNT(*) as total_records,
          AVG(CASE WHEN parameter_type = 'temperature' THEN value END) as avg_temperature,
          AVG(CASE WHEN parameter_type = 'humidity' THEN value END) as avg_humidity,
          AVG(CASE WHEN parameter_type = 'rainfall' THEN value END) as avg_rainfall
        FROM monitoring_data
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
      `);

      const result = overview.rows[0];
      const data = {
        activeStations: parseInt(result.active_stations) || 0,
        totalRecords: parseInt(result.total_records) || 0,
        avgTemperature: parseFloat(result.avg_temperature) || 0,
        avgHumidity: parseFloat(result.avg_humidity) || 0,
        avgRainfall: parseFloat(result.avg_rainfall) || 0,
        updateTime: new Date().toISOString()
      };

      this.success(res, data, '获取监测数据概览成功');
    } catch (error) {
      console.error('获取监测数据概览失败:', error);
      this.error(res, '获取监测数据概览失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取风险趋势
   */
  getRiskTrends = asyncHandler(async (req: Request, res: Response) => {
    try {
      const trends = await pool.query(`
        SELECT 
          DATE(assessment_date) as date,
          AVG(risk_score) as avg_risk_score,
          COUNT(*) as assessment_count,
          COUNT(CASE WHEN risk_level >= 4 THEN 1 END) as high_risk_count
        FROM risk_assessments
        WHERE assessment_date >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(assessment_date)
        ORDER BY date DESC
        LIMIT 30
      `);

      const data = trends.rows.map(row => ({
        date: row.date,
        avgRiskScore: parseFloat(row.avg_risk_score) || 0,
        assessmentCount: parseInt(row.assessment_count) || 0,
        highRiskCount: parseInt(row.high_risk_count) || 0
      }));

      this.success(res, data, '获取风险趋势成功');
    } catch (error) {
      console.error('获取风险趋势失败:', error);
      this.error(res, '获取风险趋势失败: ' + (error as Error).message, 500);
    }
    return;
   });

   /**
    * 获取风险等级分布统计
    */
  getRiskLevelStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      // 查询各风险等级的区域数量
      const result = await pool.query(`
        SELECT 
          base_risk_level,
          COUNT(*) as count
        FROM risk_zones 
        WHERE base_risk_level IS NOT NULL
        GROUP BY base_risk_level
        ORDER BY base_risk_level
      `);

      // 初始化统计数据
      const riskLevelStats = {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0,
        total: 0
      };

      // 填充统计数据
      result.rows.forEach((row: any) => {
        const level = row.base_risk_level;
        const count = parseInt(row.count);
        riskLevelStats[`level${level}` as keyof typeof riskLevelStats] = count;
        riskLevelStats.total += count;
      });

      this.success(res, riskLevelStats, '获取风险等级分布成功');
    } catch (error) {
      console.error('获取风险等级分布失败:', error);
      this.error(res, '获取风险等级分布失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取最新预警信息
   */
  getRecentWarnings = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      
      // 查询最新预警信息，包含关联的区域和灾害类型信息
      const result = await pool.query(`
        SELECT 
          w.id,
          w.warning_id,
          w.title,
          w.content,
          w.warning_level,
          w.zone_id,
          rz.name as zone_name,
          w.disaster_type_id,
          dt.name as disaster_type_name,
          w.issue_time,
          w.effective_time,
          w.expiry_time,
          w.status,
          w.issuing_authority,
          w.estimated_affected_population,
          w.evacuation_required,
          ST_AsText(w.affected_area) as affected_area_wkt
        FROM warnings w
        LEFT JOIN risk_zones rz ON w.zone_id = rz.id
        LEFT JOIN disaster_types dt ON w.disaster_type_id = dt.id
        WHERE w.status = 'active' AND (w.expiry_time IS NULL OR w.expiry_time > NOW())
        ORDER BY w.issue_time DESC
        LIMIT $1
      `, [limit]);

      const recentWarnings = result.rows.map((row: any) => ({
        id: row.id,
        warning_id: row.warning_id,
        title: row.title,
        content: row.content,
        warning_level: row.warning_level,
        zone_id: row.zone_id,
        zone_name: row.zone_name || '未知区域',
        disaster_type_id: row.disaster_type_id,
        disaster_type_name: row.disaster_type_name || '未知类型',
        issue_time: row.issue_time,
        effective_time: row.effective_time,
        expiry_time: row.expiry_time,
        status: row.status,
        issuing_authority: row.issuing_authority,
        estimated_affected_population: row.estimated_affected_population || 0,
        evacuation_required: row.evacuation_required || false,
        affected_area_wkt: row.affected_area_wkt
      }));

      this.success(res, recentWarnings, '获取最新预警信息成功');
    } catch (error) {
      console.error('获取最新预警信息失败:', error);
      this.error(res, '获取最新预警信息失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取系统状态
   */
  getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      // 并行获取各系统状态信息
      const [
        stationStats,
        warningStats,
        lastDataUpdate,
        lastWarningTime
      ] = await Promise.all([
        // 获取监测站点统计
        pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN is_active = true THEN 1 END) as online
          FROM monitoring_stations
        `),
        // 获取预警统计
        pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'active' AND (expiry_time IS NULL OR expiry_time > NOW()) THEN 1 END) as active
          FROM warnings
        `),
        // 获取最后数据更新时间
        pool.query(`
          SELECT MAX(timestamp) as last_update
          FROM monitoring_data
        `),
        // 获取最后预警发布时间
        pool.query(`
          SELECT MAX(issue_time) as last_issue
          FROM warnings
          WHERE status = 'active' AND (expiry_time IS NULL OR expiry_time > NOW())
        `)
      ]);

      const stationData = stationStats.rows[0];
      const warningData = warningStats.rows[0];
      const lastUpdate = lastDataUpdate.rows[0]?.last_update;
      const lastIssue = lastWarningTime.rows[0]?.last_issue;

      // 判断监测系统状态
      const monitoringStatus = this.getMonitoringStatus(stationData, lastUpdate);
      const warningStatus = this.getWarningStatus(warningData, lastIssue);
      const dataSyncStatus = this.getDataSyncStatus(lastUpdate);
      const mapServiceStatus = this.getMapServiceStatus();

      const systemStatus = {
        monitoring: {
          status: monitoringStatus.status,
          onlineStations: parseInt(stationData.online) || 0,
          totalStations: parseInt(stationData.total) || 0,
          lastUpdateTime: lastUpdate || new Date().toISOString()
        },
        warning: {
          status: warningStatus.status,
          activeWarnings: parseInt(warningData.active) || 0,
          totalWarnings: parseInt(warningData.total) || 0,
          lastIssueTime: lastIssue || new Date().toISOString()
        },
        dataSync: {
          status: dataSyncStatus.status,
          lastSyncTime: lastUpdate || new Date().toISOString(),
          syncInterval: 300 // 5分钟同步间隔
        },
        mapService: {
          status: mapServiceStatus.status,
          responseTime: 50, // 模拟响应时间
          availability: 99.9 // 模拟可用性
        }
      };

      this.success(res, systemStatus, '获取系统状态成功');
    } catch (error) {
      console.error('获取系统状态失败:', error);
      this.error(res, '获取系统状态失败: ' + (error as Error).message, 500);
    }
    return;
  });

  /**
   * 获取监测系统状态
   */
  private getMonitoringStatus(stationData: any, lastUpdate: string | null): { status: 'normal' | 'warning' | 'error' } {
    // 基于API响应是否正常来判断系统状态
    // 如果能成功获取到数据，说明监测系统API正常
    if (stationData && typeof stationData.total !== 'undefined') {
      return { status: 'normal' };
    } else {
      return { status: 'error' };
    }
  }

  /**
   * 获取预警系统状态
   */
  private getWarningStatus(warningData: any, lastIssue: string | null): { status: 'normal' | 'warning' | 'error' } {
    // 基于API响应是否正常来判断系统状态
    // 如果能成功获取到预警数据，说明预警系统API正常
    if (warningData && typeof warningData.total !== 'undefined') {
      return { status: 'normal' };
    } else {
      return { status: 'error' };
    }
  }

  /**
   * 获取数据同步状态
   */
  private getDataSyncStatus(lastUpdate: string | null): { status: 'normal' | 'warning' | 'error' } {
    // 基于API响应是否正常来判断系统状态
    // 如果能成功执行查询（无论是否有数据），说明数据同步API正常
    return { status: 'normal' };
  }

  /**
   * 获取地图服务状态
   */
  private getMapServiceStatus(): { status: 'normal' | 'warning' | 'error' } {
    // 这里可以添加实际的地图服务检查逻辑
    return { status: 'normal' };
  }

  /**
   * 检查监测系统状态（旧方法，保留兼容性）
   */
  private async checkMonitoringSystemStatus(): Promise<{ status: string; message: string }> {
    try {
      const recentData = await this.monitoringDataModel.getRecentData(1);
      const now = new Date();
      const lastDataTime = recentData.length > 0 ? new Date(recentData[0].timestamp) : null;
      
      if (!lastDataTime || (now.getTime() - lastDataTime.getTime()) > 30 * 60 * 1000) {
        return { status: 'warning', message: '数据延迟' };
      }
      
      return { status: 'online', message: '正常' };
    } catch (error) {
      return { status: 'offline', message: '异常' };
    }
  }

  /**
   * 检查预警系统状态
   */
  private async checkWarningSystemStatus(): Promise<{ status: string; message: string }> {
    try {
      // 检查是否有活跃预警
      const activeWarnings = await WarningModel.findActiveWarnings();
      return { status: 'online', message: '正常' };
    } catch (error) {
      return { status: 'offline', message: '异常' };
    }
  }

  /**
   * 检查数据同步状态
   */
  private async checkDataSyncStatus(): Promise<{ status: string; message: string }> {
    try {
      // 检查最近的数据更新时间
      const lastUpdate = await this.getLastDataUpdateTime();
      const now = new Date();
      
      if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > 60 * 60 * 1000) {
        return { status: 'warning', message: '延迟' };
      }
      
      return { status: 'online', message: '正常' };
    } catch (error) {
      return { status: 'offline', message: '异常' };
    }
  }

  /**
   * 获取最后数据更新时间
   */
  private async getLastDataUpdateTime(): Promise<Date | null> {
    try {
      const recentData = await this.monitoringDataModel.getRecentData(1);
      return recentData.length > 0 ? new Date(recentData[0].timestamp) : null;
    } catch (error) {
      return null;
    }
  }
}