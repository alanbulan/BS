"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RouteController_1 = require("../controllers/RouteController");
const router = (0, express_1.Router)();
const routeController = new RouteController_1.RouteController();
router.post('/calculate', routeController.calculateRoute);
router.put('/:routeId/status', routeController.updateRouteStatus);
router.post('/:routeId/check-rerouting', routeController.checkRerouting);
router.get('/shelters/nearest', routeController.getNearestShelters);
router.get('/:routeId', routeController.getRouteDetails);
exports.default = router;
//# sourceMappingURL=routeRoutes.js.map