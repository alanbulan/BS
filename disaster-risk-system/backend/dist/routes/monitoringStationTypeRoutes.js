"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MonitoringStationTypeController_1 = require("../controllers/MonitoringStationTypeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new MonitoringStationTypeController_1.MonitoringStationTypeController();
router.get('/', controller.getTypes);
router.use(auth_1.verifyToken);
router.use(auth_1.requireExpertOrAdmin);
router.post('/', controller.createType);
router.put('/:id', controller.updateType);
router.get('/stats/usage', controller.getTypeUsageStats);
router.use(auth_1.requireAdmin);
router.delete('/:id', controller.deleteType);
exports.default = router;
//# sourceMappingURL=monitoringStationTypeRoutes.js.map