import { Router } from 'express';
import { RiskAssessmentController } from '../controllers/RiskAssessmentController';

const router = Router();
const riskAssessmentController = new RiskAssessmentController();

// CRUD操作路由
router.get('/', riskAssessmentController.getRiskAssessments);
router.get('/:id', riskAssessmentController.getRiskAssessment);
router.post('/', riskAssessmentController.createRiskAssessment);
router.put('/:id', riskAssessmentController.updateRiskAssessment);
router.delete('/:id', riskAssessmentController.deleteRiskAssessment);

// 风险评估功能路由
router.post('/assess/zone/:zoneId', riskAssessmentController.assessZoneRisk);
router.post('/assess/batch', riskAssessmentController.batchAssessRisk);
router.post('/assess/location', riskAssessmentController.assessLocationRisk);
router.get('/zone/:zoneId/history', riskAssessmentController.getHistoricalAssessments);
router.get('/high-risk-zones', riskAssessmentController.getHighRiskZones);
router.get('/stats', riskAssessmentController.getRiskAssessmentStats);

export default router;