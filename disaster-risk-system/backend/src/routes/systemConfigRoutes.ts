import { Router } from 'express';
import { SystemConfigController } from '../controllers/SystemConfigController';
import { verifyToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const systemConfigController = new SystemConfigController();

// 所有路由都需要认证
router.use(verifyToken);

// 普通用户可以访问的路由
// 根据配置键获取配置值（只读）
router.get('/value/:key', systemConfigController.getConfigValue);

// 根据配置类型获取配置（只读）
router.get('/type/:type', systemConfigController.getConfigsByType);

// 获取预警级别配置（只读）
router.get('/warning/levels', systemConfigController.getWarningLevels);

// 获取系统信息（只读）
router.get('/system/info', systemConfigController.getSystemInfo);

// 验证配置值
router.post('/validate', systemConfigController.validateConfig);

// 需要管理员权限的路由
router.use(authorize(['admin']));

// 获取系统配置列表
router.get('/', systemConfigController.getConfigs);

// 根据配置键获取配置
router.get('/:key', systemConfigController.getConfigByKey);

// 创建系统配置
router.post('/', systemConfigController.createConfig);

// 更新系统配置
router.put('/:key', systemConfigController.updateConfig);

// 设置配置值
router.patch('/:key/value', systemConfigController.setConfigValue);

// 批量设置配置
router.post('/batch/set', systemConfigController.setBatchConfigs);

// 删除系统配置（软删除）
router.delete('/:key', systemConfigController.deleteConfig);

// 物理删除系统配置
router.delete('/:key/hard', systemConfigController.hardDeleteConfig);

// 获取所有配置类型
router.get('/meta/types', systemConfigController.getConfigTypes);

// 获取配置统计信息
router.get('/stats/overview', systemConfigController.getStatistics);

// 导出配置
router.get('/export/download', systemConfigController.exportConfigs);

// 导入配置
router.post('/import/upload', systemConfigController.importConfigs);

// 重置配置到默认值
router.post('/reset/defaults', systemConfigController.resetToDefaults);

// 清除缓存
router.post('/cache/clear', systemConfigController.clearCache);

export default router;