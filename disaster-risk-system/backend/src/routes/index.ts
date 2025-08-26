import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import disasterTypeRoutes from './disasterTypeRoutes';
import riskZoneRoutes from './riskZoneRoutes';
import riskAssessmentRoutes from './riskAssessmentRoutes';
import monitoringRoutes from './monitoringRoutes';
import monitoringStationRoutes from './monitoringStationRoutes';
import shelterRoutes from './shelterRoutes';
import routeRoutes from './routeRoutes';
import userReportRoutes from './userReportRoutes';
import warningRoutes from './warningRoutes';
import schedulerRoutes from './schedulerRoutes';
import escapeRouteRoutes from './escapeRouteRoutes';
import systemConfigRoutes from './systemConfigRoutes';
import roadNetworkRoutes from './roadNetworkRoutes';
import dashboardRoutes from './dashboardRoutes';
import { SystemConfigController } from '../controllers/SystemConfigController';
import monitoringStationTypeRoutes from './monitoringStationTypeRoutes';

const router = Router();
const systemConfigController = new SystemConfigController();

// API版本前缀
const API_VERSION = '/api/v1';

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 系统信息路由（不需要认证）
router.get(`${API_VERSION}/system/info`, systemConfigController.getSystemInfo);

// API文档路由
router.get(`${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: '地质灾害风险评估系统 API',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      disasterTypes: `${API_VERSION}/disaster-types`,
      riskZones: `${API_VERSION}/risk-zones`,
      riskAssessments: `${API_VERSION}/risk-assessments`,
      monitoring: `${API_VERSION}/monitoring`,
      monitoringStations: `${API_VERSION}/monitoring-stations`,
      shelters: `${API_VERSION}/shelters`,
      routes: `${API_VERSION}/routes`,
      reports: `${API_VERSION}/reports`,
      warnings: `${API_VERSION}/warnings`,
      scheduler: `${API_VERSION}/scheduler`,
      escapeRoutes: `${API_VERSION}/escape-routes`,
      systemConfig: `${API_VERSION}/system-config`,
      roadNetwork: `${API_VERSION}/road-network`,
      dashboard: `${API_VERSION}/dashboard`
    },
    documentation: {
      health: '/health',
      apiDocs: `${API_VERSION}`
    }
  });
});

// 注册各模块路由
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/disaster-types`, disasterTypeRoutes);
router.use(`${API_VERSION}/risk-zones`, riskZoneRoutes);
router.use(`${API_VERSION}/risk-assessments`, riskAssessmentRoutes);
router.use(`${API_VERSION}/monitoring`, monitoringRoutes);
router.use(`${API_VERSION}/monitoring-stations`, monitoringStationRoutes);
router.use(`${API_VERSION}/monitoring-station-types`, monitoringStationTypeRoutes);
router.use(`${API_VERSION}/shelters`, shelterRoutes);
router.use(`${API_VERSION}/routes`, routeRoutes);
router.use(`${API_VERSION}/reports`, userReportRoutes);
router.use(`${API_VERSION}/warnings`, warningRoutes);
router.use(`${API_VERSION}/scheduler`, schedulerRoutes);
router.use(`${API_VERSION}/escape-routes`, escapeRouteRoutes);
router.use(`${API_VERSION}/system-config`, systemConfigRoutes);
router.use(`${API_VERSION}/road-network`, roadNetworkRoutes);
router.use(`${API_VERSION}/dashboard`, dashboardRoutes);

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl
  });
});

export default router;