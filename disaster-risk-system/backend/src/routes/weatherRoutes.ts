/**
 * 天气数据路由
 */

import { Router } from 'express';
import { pool } from '../config/database';
import { WeatherController } from '../controllers/WeatherController';

const router = Router();
const weatherController = new WeatherController(pool);

// 获取当前天气
router.get('/current', weatherController.getCurrentWeather);

// 获取天气预报
router.get('/forecast', weatherController.getForecast);

// 获取天气预警
router.get('/alerts', weatherController.getAlerts);

// 批量获取天气数据
router.post('/batch', weatherController.getBatchWeather);

// 测试API连接
router.get('/test', weatherController.testConnection);

export default router;



