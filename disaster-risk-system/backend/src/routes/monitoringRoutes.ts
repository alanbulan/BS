import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';
import { pool } from '../config/database';

const router = Router();
const monitoringController = new MonitoringController();

/**
 * @route GET /api/monitoring
 * @desc 获取监测数据列表
 * @access Public
 */
router.get('/', monitoringController.getMonitoringData);

/**
 * @route GET /api/monitoring/nearby
 * @desc 根据位置获取附近的监测数据
 * @access Public
 */
router.get('/nearby', monitoringController.getNearbyMonitoringData);

/**
 * @route POST /api/monitoring
 * @desc 添加监测数据
 * @access Public
 */
router.post('/', monitoringController.addMonitoringData);

/**
 * @route POST /api/monitoring/batch
 * @desc 批量添加监测数据
 * @access Public
 */
router.post('/batch', monitoringController.batchAddMonitoringData);

/**
 * @route GET /api/monitoring/stations/:station_id/statistics
 * @desc 获取监测站点统计信息
 * @access Public
 */
router.get('/stations/:station_id/statistics', monitoringController.getStationStatistics);

/**
 * @route GET /api/monitoring/data-types
 * @desc 获取数据类型列表
 * @access Public
 */
router.get('/data-types', monitoringController.getDataTypes);

/**
 * @route GET /api/monitoring/stations
 * @desc 获取监测站点列表
 * @access Public
 */
router.get('/stations', monitoringController.getStations);

/**
 * @route POST /api/monitoring/stations
 * @desc 创建监测站
 * @access Public
 */
router.post('/stations', monitoringController.createStation);

/**
 * @route GET /api/monitoring/stations/:id
 * @desc 获取监测站详情
 * @access Public
 */
router.get('/stations/:id', monitoringController.getStationDetail);

/**
 * @route PUT /api/monitoring/stations/:id
 * @desc 更新监测站
 * @access Public
 */
router.put('/stations/:id', monitoringController.updateStation);

/**
 * @route DELETE /api/monitoring/stations/:id
 * @desc 删除监测站
 * @access Public
 */
router.delete('/stations/:id', monitoringController.deleteStation);

// 批量更新监测站状态已移至 monitoringStationRoutes.ts
// PUT /api/v1/monitoring/stations/batch/status

/**
 * @route GET /api/monitoring/realtime
 * @desc 获取实时监测数据
 * @access Public
 */
router.get('/realtime', monitoringController.getRealtimeData);

/**
 * @route GET /api/monitoring/anomalous
 * @desc 获取异常监测数据
 * @access Public
 */
router.get('/anomalous', monitoringController.getAnomalousData);

/**
 * @route GET /api/monitoring/quality-report
 * @desc 获取数据质量报告
 * @access Public
 */
router.get('/quality-report', monitoringController.getDataQualityReport);

/**
 * @route GET /api/monitoring/trend
 * @desc 获取数据趋势
 * @access Public
 */
router.get('/trend', monitoringController.getDataTrend);

/**
 * @route PUT /api/monitoring/:id
 * @desc 更新监测数据
 * @access Public
 */
router.put('/:id', monitoringController.updateMonitoringData);

/**
 * @route DELETE /api/monitoring/:id
 * @desc 删除监测数据
 * @access Public
 */
router.delete('/:id', monitoringController.deleteMonitoringData);

export default router;