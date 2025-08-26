"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardController_1 = require("../controllers/DashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const dashboardController = new DashboardController_1.DashboardController();
router.use(auth_1.verifyToken);
router.get('/stats', dashboardController.getDashboardStats.bind(dashboardController));
router.get('/risk-levels', dashboardController.getRiskLevelStats.bind(dashboardController));
router.get('/warnings/recent', dashboardController.getRecentWarnings.bind(dashboardController));
router.get('/system-status', dashboardController.getSystemStatus.bind(dashboardController));
router.get('/station-stats', dashboardController.getStationStats.bind(dashboardController));
router.get('/disaster-type-stats', dashboardController.getDisasterTypeStats.bind(dashboardController));
router.get('/monitoring-overview', dashboardController.getMonitoringOverview.bind(dashboardController));
router.get('/risk-trends', dashboardController.getRiskTrends.bind(dashboardController));
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map