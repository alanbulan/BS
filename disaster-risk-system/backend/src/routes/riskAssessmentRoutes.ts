import { Router } from 'express';
import { RiskAssessmentController } from '../controllers/RiskAssessmentController';

const router = Router();
const riskAssessmentController = new RiskAssessmentController();

// CRUD操作路由
router.get('/', riskAssessmentController.getRiskAssessments);
// 导出需放在 '/:id' 之前，避免被动态路由拦截
router.get('/export', riskAssessmentController.exportRiskAssessments);
router.get('/:id', riskAssessmentController.getRiskAssessment);
router.post('/', riskAssessmentController.createRiskAssessment);
router.put('/:id', riskAssessmentController.updateRiskAssessment);
router.delete('/:id', riskAssessmentController.deleteRiskAssessment);

// 风险评估功能路由
router.post('/assess/zone/:zoneId', riskAssessmentController.assessZoneRisk);
router.post('/assess/:zoneId', riskAssessmentController.assessZoneRisk); // 简化路由，兼容前端
router.post('/assess/batch', riskAssessmentController.batchAssessRisk);
router.post('/batch-assess', riskAssessmentController.batchAssessRisk); // 前端兼容路由
router.post('/assess/location', riskAssessmentController.assessLocationRisk);
router.get('/zone/:zoneId/history', riskAssessmentController.getHistoricalAssessments);
router.get('/high-risk-zones', riskAssessmentController.getHighRiskZones);
router.get('/stats', riskAssessmentController.getRiskAssessmentStats);

export default router;