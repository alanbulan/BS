"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SchedulerController_1 = require("../controllers/SchedulerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const schedulerController = new SchedulerController_1.SchedulerController();
router.get('/status', auth_1.verifyToken, auth_1.requireAdmin, schedulerController.getTaskStatus);
router.post('/auto-assess', auth_1.verifyToken, auth_1.requireAdmin, schedulerController.manualAutoAssess);
router.post('/process-expired', auth_1.verifyToken, auth_1.requireAdmin, schedulerController.manualProcessExpired);
router.post('/cleanup-tokens', auth_1.verifyToken, auth_1.requireAdmin, schedulerController.manualCleanupTokens);
router.post('/start', auth_1.verifyToken, auth_1.requireAdmin, schedulerController.startTasks);
router.post('/stop', auth_1.verifyToken, auth_1.requireAdmin, schedulerController.stopTasks);
exports.default = router;
//# sourceMappingURL=schedulerRoutes.js.map