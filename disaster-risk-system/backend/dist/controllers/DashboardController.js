"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const BaseController_1 = require("./BaseController");
const asyncHandler_1 = require("../middleware/asyncHandler");
const RiskZoneModel_1 = require("../models/RiskZoneModel");
const WarningModel_1 = require("../models/WarningModel");
const MonitoringStationModel_1 = require("../models/MonitoringStationModel");
const ShelterModel_1 = require("../models/ShelterModel");
const UserReportModel_1 = require("../models/UserReportModel");
const MonitoringDataModel_1 = require("../models/MonitoringDataModel");
const database_1 = require("../config/database");
class DashboardController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.getDashboardStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const [zoneStats, warningStats, stationStats, shelterStats, reportStats, userStats, assessmentStats] = await Promise.all([
                    RiskZoneModel_1.RiskZoneModel.getStatistics(),
                    WarningModel_1.WarningModel.getWarningStats(),
                    this.stationModel.paginate(1, 1000).then(result => ({
                        total: result.pagination.total,
                        online: result.data.filter(s => s.is_active).length
                    })),
                    this.shelterModel.getStatistics(),
                    this.userReportModel.getStatistics(),
                    database_1.pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
                    database_1.pool.query('SELECT COUNT(*) as total FROM risk_assessments WHERE assessment_time >= NOW() - INTERVAL \'30 days\'')
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
            }
            catch (error) {
                console.error('获取仪表板统计数据失败:', error);
                this.error(res, '获取仪表板统计数据失败: ' + error.message, 500);
            }
            return;
        });
        this.getStationStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const stationStats = await database_1.pool.query(`
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
            }
            catch (error) {
                console.error('获取监测站点统计失败:', error);
                this.error(res, '获取监测站点统计失败: ' + error.message, 500);
            }
            return;
        });
        this.getDisasterTypeStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const typeStats = await database_1.pool.query(`
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
            }
            catch (error) {
                console.error('获取灾害类型统计失败:', error);
                this.error(res, '获取灾害类型统计失败: ' + error.message, 500);
            }
            return;
        });
        this.getMonitoringOverview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const overview = await database_1.pool.query(`
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
            }
            catch (error) {
                console.error('获取监测数据概览失败:', error);
                this.error(res, '获取监测数据概览失败: ' + error.message, 500);
            }
            return;
        });
        this.getRiskTrends = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const trends = await database_1.pool.query(`
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
            }
            catch (error) {
                console.error('获取风险趋势失败:', error);
                this.error(res, '获取风险趋势失败: ' + error.message, 500);
            }
            return;
        });
        this.getRiskLevelStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const result = await database_1.pool.query(`
        SELECT 
          base_risk_level,
          COUNT(*) as count
        FROM risk_zones 
        WHERE base_risk_level IS NOT NULL
        GROUP BY base_risk_level
        ORDER BY base_risk_level
      `);
                const riskLevelStats = {
                    level1: 0,
                    level2: 0,
                    level3: 0,
                    level4: 0,
                    level5: 0,
                    total: 0
                };
                result.rows.forEach((row) => {
                    const level = row.base_risk_level;
                    const count = parseInt(row.count);
                    riskLevelStats[`level${level}`] = count;
                    riskLevelStats.total += count;
                });
                this.success(res, riskLevelStats, '获取风险等级分布成功');
            }
            catch (error) {
                console.error('获取风险等级分布失败:', error);
                this.error(res, '获取风险等级分布失败: ' + error.message, 500);
            }
            return;
        });
        this.getRecentWarnings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const { limit = 10 } = req.query;
                const result = await database_1.pool.query(`
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
                const recentWarnings = result.rows.map((row) => ({
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
            }
            catch (error) {
                console.error('获取最新预警信息失败:', error);
                this.error(res, '获取最新预警信息失败: ' + error.message, 500);
            }
            return;
        });
        this.getSystemStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            try {
                const [stationStats, warningStats, lastDataUpdate, lastWarningTime] = await Promise.all([
                    database_1.pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN is_active = true THEN 1 END) as online
          FROM monitoring_stations
        `),
                    database_1.pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'active' AND (expiry_time IS NULL OR expiry_time > NOW()) THEN 1 END) as active
          FROM warnings
        `),
                    database_1.pool.query(`
          SELECT MAX(timestamp) as last_update
          FROM monitoring_data
        `),
                    database_1.pool.query(`
          SELECT MAX(issue_time) as last_issue
          FROM warnings
          WHERE status = 'active' AND (expiry_time IS NULL OR expiry_time > NOW())
        `)
                ]);
                const stationData = stationStats.rows[0];
                const warningData = warningStats.rows[0];
                const lastUpdate = lastDataUpdate.rows[0]?.last_update;
                const lastIssue = lastWarningTime.rows[0]?.last_issue;
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
                        syncInterval: 300
                    },
                    mapService: {
                        status: mapServiceStatus.status,
                        responseTime: 50,
                        availability: 99.9
                    }
                };
                this.success(res, systemStatus, '获取系统状态成功');
            }
            catch (error) {
                console.error('获取系统状态失败:', error);
                this.error(res, '获取系统状态失败: ' + error.message, 500);
            }
            return;
        });
        this.shelterModel = new ShelterModel_1.ShelterModel();
        this.userReportModel = new UserReportModel_1.UserReportModel();
        this.monitoringDataModel = new MonitoringDataModel_1.MonitoringDataModel();
        this.stationModel = new MonitoringStationModel_1.MonitoringStationModel();
    }
    getMonitoringStatus(stationData, lastUpdate) {
        if (stationData && typeof stationData.total !== 'undefined') {
            return { status: 'normal' };
        }
        else {
            return { status: 'error' };
        }
    }
    getWarningStatus(warningData, lastIssue) {
        if (warningData && typeof warningData.total !== 'undefined') {
            return { status: 'normal' };
        }
        else {
            return { status: 'error' };
        }
    }
    getDataSyncStatus(lastUpdate) {
        return { status: 'normal' };
    }
    getMapServiceStatus() {
        return { status: 'normal' };
    }
    async checkMonitoringSystemStatus() {
        try {
            const recentData = await this.monitoringDataModel.getRecentData(1);
            const now = new Date();
            const lastDataTime = recentData.length > 0 ? new Date(recentData[0].timestamp) : null;
            if (!lastDataTime || (now.getTime() - lastDataTime.getTime()) > 30 * 60 * 1000) {
                return { status: 'warning', message: '数据延迟' };
            }
            return { status: 'online', message: '正常' };
        }
        catch (error) {
            return { status: 'offline', message: '异常' };
        }
    }
    async checkWarningSystemStatus() {
        try {
            const activeWarnings = await WarningModel_1.WarningModel.findActiveWarnings();
            return { status: 'online', message: '正常' };
        }
        catch (error) {
            return { status: 'offline', message: '异常' };
        }
    }
    async checkDataSyncStatus() {
        try {
            const lastUpdate = await this.getLastDataUpdateTime();
            const now = new Date();
            if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > 60 * 60 * 1000) {
                return { status: 'warning', message: '延迟' };
            }
            return { status: 'online', message: '正常' };
        }
        catch (error) {
            return { status: 'offline', message: '异常' };
        }
    }
    async getLastDataUpdateTime() {
        try {
            const recentData = await this.monitoringDataModel.getRecentData(1);
            return recentData.length > 0 ? new Date(recentData[0].timestamp) : null;
        }
        catch (error) {
            return null;
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=DashboardController.js.map