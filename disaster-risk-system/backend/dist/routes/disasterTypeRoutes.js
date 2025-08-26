"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DisasterTypeController_1 = require("../controllers/DisasterTypeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const disasterTypeController = new DisasterTypeController_1.DisasterTypeController();
router.get('/', disasterTypeController.getDisasterTypes);
router.get('/stats', disasterTypeController.getDisasterTypeStats);
router.get('/risk-level/:risk_level', disasterTypeController.getDisasterTypesByRiskLevel);
router.get('/:id', disasterTypeController.getDisasterTypeById);
router.post('/', auth_1.verifyToken, auth_1.requireExpertOrAdmin, disasterTypeController.createDisasterType);
router.put('/:id', auth_1.verifyToken, auth_1.requireExpertOrAdmin, disasterTypeController.updateDisasterType);
router.patch('/:id/status', auth_1.verifyToken, auth_1.requireAdmin, disasterTypeController.toggleDisasterTypeStatus);
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, disasterTypeController.deleteDisasterType);
exports.default = router;
//# sourceMappingURL=disasterTypeRoutes.js.map