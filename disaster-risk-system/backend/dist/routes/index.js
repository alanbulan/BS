"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const disasterTypeRoutes_1 = __importDefault(require("./disasterTypeRoutes"));
const riskZoneRoutes_1 = __importDefault(require("./riskZoneRoutes"));
const riskAssessmentRoutes_1 = __importDefault(require("./riskAssessmentRoutes"));
const monitoringRoutes_1 = __importDefault(require("./monitoringRoutes"));
const monitoringStationRoutes_1 = __importDefault(require("./monitoringStationRoutes"));
const shelterRoutes_1 = __importDefault(require("./shelterRoutes"));
const routeRoutes_1 = __importDefault(require("./routeRoutes"));
const userReportRoutes_1 = __importDefault(require("./userReportRoutes"));
const warningRoutes_1 = __importDefault(require("./warningRoutes"));
const schedulerRoutes_1 = __importDefault(require("./schedulerRoutes"));
const escapeRouteRoutes_1 = __importDefault(require("./escapeRouteRoutes"));
const systemConfigRoutes_1 = __importDefault(require("./systemConfigRoutes"));
const roadNetworkRoutes_1 = __importDefault(require("./roadNetworkRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const SystemConfigController_1 = require("../controllers/SystemConfigController");
const monitoringStationTypeRoutes_1 = __importDefault(require("./monitoringStationTypeRoutes"));
const router = (0, express_1.Router)();
const systemConfigController = new SystemConfigController_1.SystemConfigController();
const API_VERSION = '/api/v1';
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
router.get(`${API_VERSION}/system/info`, systemConfigController.getSystemInfo);
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
router.use(`${API_VERSION}/auth`, authRoutes_1.default);
router.use(`${API_VERSION}/users`, userRoutes_1.default);
router.use(`${API_VERSION}/disaster-types`, disasterTypeRoutes_1.default);
router.use(`${API_VERSION}/risk-zones`, riskZoneRoutes_1.default);
router.use(`${API_VERSION}/risk-assessments`, riskAssessmentRoutes_1.default);
router.use(`${API_VERSION}/monitoring`, monitoringRoutes_1.default);
router.use(`${API_VERSION}/monitoring-stations`, monitoringStationRoutes_1.default);
router.use(`${API_VERSION}/monitoring-station-types`, monitoringStationTypeRoutes_1.default);
router.use(`${API_VERSION}/shelters`, shelterRoutes_1.default);
router.use(`${API_VERSION}/routes`, routeRoutes_1.default);
router.use(`${API_VERSION}/reports`, userReportRoutes_1.default);
router.use(`${API_VERSION}/warnings`, warningRoutes_1.default);
router.use(`${API_VERSION}/scheduler`, schedulerRoutes_1.default);
router.use(`${API_VERSION}/escape-routes`, escapeRouteRoutes_1.default);
router.use(`${API_VERSION}/system-config`, systemConfigRoutes_1.default);
router.use(`${API_VERSION}/road-network`, roadNetworkRoutes_1.default);
router.use(`${API_VERSION}/dashboard`, dashboardRoutes_1.default);
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.originalUrl
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map