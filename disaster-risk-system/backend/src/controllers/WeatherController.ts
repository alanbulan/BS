/**
 * 天气数据控制器
 * 提供天气数据查询接口
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { BaseController } from './BaseController';
import { WeatherService } from '../services/WeatherService';

export class WeatherController extends BaseController {
  private weatherService: WeatherService;

  constructor(database: Pool) {
    super();
    this.weatherService = new WeatherService(database);
  }

  /**
   * 获取当前天气
   * GET /api/v1/weather/current?latitude=39.9&longitude=116.4
   */
  getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        this.error(res, '经纬度参数不能为空', 400);
        return;
      }

      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);

      if (isNaN(lat) || isNaN(lon)) {
        this.error(res, '经纬度参数格式错误', 400);
        return;
      }

      const weatherData = await this.weatherService.getCurrentWeather(lat, lon);

      if (!weatherData) {
        this.error(res, '获取天气数据失败', 500);
        return;
      }

      // 映射字段名以匹配前端期望的格式
      const formattedData = {
        location: `${weatherData.location?.latitude || lat}, ${weatherData.location?.longitude || lon}`,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        windSpeed: weatherData.wind_speed,
        conditions: weatherData.weather_condition,
        timestamp: weatherData.timestamp,
        pressure: weatherData.pressure,
        visibility: weatherData.visibility
      };

      this.success(res, formattedData, '获取天气数据成功');
    } catch (error) {
      console.error('获取当前天气失败:', error);
      this.error(res, '获取当前天气失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取天气预报
   * GET /api/v1/weather/forecast?latitude=39.9&longitude=116.4&days=7
   */
  getForecast = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, days = '7' } = req.query;

      if (!latitude || !longitude) {
        this.error(res, '经纬度参数不能为空', 400);
        return;
      }

      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const numDays = parseInt(days as string);

      if (isNaN(lat) || isNaN(lon)) {
        this.error(res, '经纬度参数格式错误', 400);
        return;
      }

      const forecast = await this.weatherService.getForecast(lat, lon, numDays);

      this.success(res, forecast, '获取天气预报成功');
    } catch (error) {
      console.error('获取天气预报失败:', error);
      this.error(res, '获取天气预报失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 获取天气预警
   * GET /api/v1/weather/alerts?latitude=39.9&longitude=116.4
   */
  getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        this.error(res, '经纬度参数不能为空', 400);
        return;
      }

      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);

      if (isNaN(lat) || isNaN(lon)) {
        this.error(res, '经纬度参数格式错误', 400);
        return;
      }

      const alerts = await this.weatherService.getWeatherAlerts(lat, lon);

      this.success(res, alerts, '获取天气预警成功');
    } catch (error) {
      console.error('获取天气预警失败:', error);
      this.error(res, '获取天气预警失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 批量获取天气数据
   * POST /api/v1/weather/batch
   * Body: { locations: [{ latitude: 39.9, longitude: 116.4 }, ...] }
   */
  getBatchWeather = async (req: Request, res: Response): Promise<void> => {
    try {
      const { locations } = req.body;

      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        this.error(res, '位置列表不能为空', 400);
        return;
      }

      if (locations.length > 50) {
        this.error(res, '一次最多查询50个位置', 400);
        return;
      }

      const weatherData = await this.weatherService.getBatchWeather(locations);

      this.success(res, weatherData, `成功获取 ${weatherData.length} 个位置的天气数据`);
    } catch (error) {
      console.error('批量获取天气数据失败:', error);
      this.error(res, '批量获取天气数据失败: ' + (error as Error).message, 500);
    }
  };

  /**
   * 测试天气API连接
   * GET /api/v1/weather/test
   */
  testConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const isConnected = await this.weatherService.testConnection();

      if (isConnected) {
        this.success(res, { connected: true }, '天气API连接正常');
      } else {
        this.error(res, '天气API连接失败或未配置', 503);
      }
    } catch (error) {
      console.error('测试天气API连接失败:', error);
      this.error(res, '测试天气API连接失败: ' + (error as Error).message, 500);
    }
  };
}



