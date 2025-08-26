"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserReportController_1 = require("../controllers/UserReportController");
const router = (0, express_1.Router)();
const userReportController = new UserReportController_1.UserReportController();
router.get('/', userReportController.getUserReports);
router.get('/nearby', userReportController.getNearbyReports);
router.get('/stats/types', userReportController.getReportTypeStats);
router.get('/emergency/recent', userReportController.getRecentEmergencyReports);
router.get('/types', userReportController.getReportTypes);
router.get('/:id', userReportController.getUserReportById);
router.post('/', userReportController.createUserReport);
router.patch('/:id/verify', userReportController.verifyUserReport);
router.patch('/:id/vote', userReportController.updateVotes);
router.delete('/:id', userReportController.deleteUserReport);
exports.default = router;
//# sourceMappingURL=userReportRoutes.js.map