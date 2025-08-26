import { Router } from 'express';
import { ShelterController } from '../controllers/ShelterController';

const router = Router();
const shelterController = new ShelterController();

// 获取避难场所列表
router.get('/', shelterController.getShelters);

// 获取最近的避难场所
router.get('/nearest', shelterController.getNearestShelters);

// 获取避难场所统计信息
router.get('/statistics', shelterController.getShelterStatistics);

// 获取避难场所类型列表
router.get('/types', shelterController.getShelterTypes);

// 新增: 导出避难所数据
router.get('/export', shelterController.exportShelters);

// 新增: 批量更新状态
router.patch('/batch-status', shelterController.batchUpdateStatus);

// 新增: 批量删除
router.delete('/batch', shelterController.batchDelete);

// 获取避难场所详情
router.get('/:id', shelterController.getShelterById);

// 新增: 容量历史
router.get('/:id/capacity-history', shelterController.getCapacityHistory);

// 创建避难场所
router.post('/', shelterController.createShelter);

// 更新避难场所
router.put('/:id', shelterController.updateShelter);

// 更新避难场所占用情况
router.patch('/:id/occupancy', shelterController.updateOccupancy);

// 删除避难场所
router.delete('/:id', shelterController.deleteShelter);

export default router;