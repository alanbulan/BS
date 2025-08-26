import { Router } from 'express';
import { RiskZoneController } from '../controllers/RiskZoneController';

const router = Router();
const riskZoneController = new RiskZoneController();

// 风险区域管理路由
router.post('/', riskZoneController.createRiskZone);                           // 创建风险区域
router.get('/', riskZoneController.getRiskZones);                              // 获取风险区域列表
router.get('/stats', riskZoneController.getRiskZoneStats);                     // 获取风险区域统计信息
router.get('/location', riskZoneController.getRiskZonesByLocation);            // 根据位置查找风险区域
router.get('/nearby', riskZoneController.getNearbyRiskZones);                  // 查找附近的风险区域
router.get('/disaster-type/:disaster_type_id', riskZoneController.getRiskZonesByDisasterType); // 根据灾害类型获取风险区域
router.get('/risk-level', riskZoneController.getRiskZonesByRiskLevel);         // 根据风险等级获取风险区域
router.post('/overlapping', riskZoneController.getOverlappingRiskZones);       // 查找重叠的风险区域
router.get('/code/:code', riskZoneController.getRiskZoneByCode);               // 根据编码获取风险区域
router.get('/:id', riskZoneController.getRiskZoneById);                        // 根据ID获取风险区域
router.get('/:id/bounds', riskZoneController.getRiskZoneBounds);               // 获取区域边界框
router.put('/:id', riskZoneController.updateRiskZone);                         // 更新风险区域
router.delete('/:id', riskZoneController.deleteRiskZone);                      // 删除风险区域

export default router;