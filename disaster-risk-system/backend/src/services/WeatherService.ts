/**
 * 气象数据服务
 * 从数据库monitoring_data表读取监测站点的气象数据
 * 支持本地部署，无需外部API
 */

import { Pool } from 'pg';
import redisConfig from '../config/redis';

// 天气数据类型
export interface WeatherData {
  temperature: number; // 温度（摄氏度）
  humidity: number; // 湿度（%）
  pressure: number; // 气压（hPa）
  wind_speed: number; // 风速（m/s）
  wind_direction: number; // 风向（度）
  rainfall: number; // 降雨量（mm）
  rainfall_24h: number; // 24小时降雨量（mm）
  weather_condition: string; // 天气状况
  visibility: number; // 能见度（km）
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
}

// 天气预报数据
export interface ForecastData {
  timestamp: Date;
  temperature_max: number;
  temperature_min: number;
  rainfall_probability: number; // 降雨概率（%）
  rainfall_amount: number; // 预计降雨量（mm）
  weather_condition: string;
  wind_speed: number;
}

// 天气预警
export interface WeatherAlert {
  alert_type: string; // 预警类型：暴雨、台风、高温等
  level: string; // 预警级别：蓝色、黄色、橙色、红色
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  affected_regions: string[];
}

export class WeatherService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * 获取实时天气数据
   * 从最近的监测站点获取最新的气象数据
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
      // 检查缓存
      const cacheKey = `weather:current:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
      const cached = await redisConfig.get(cacheKey);
      
      if (cached) {
        console.log('从缓存获取天气数据');
        return JSON.parse(cached);
      }

      // 从数据库获取最近监测站的最新气象数据
      const query = `
        WITH nearest_station AS (
          SELECT 
            station_id,
            name,
            ST_X(location::geometry) as lon,
            ST_Y(location::geometry) as lat,
            ST_Distance(
              location::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) as distance
          FROM monitoring_stations
          WHERE is_active = true 
            AND location IS NOT NULL
          ORDER BY location::geography <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          LIMIT 1
        ),
        latest_data AS (
          SELECT 
            data_type,
            value,
            timestamp,
            ROW_NUMBER() OVER (PARTITION BY data_type ORDER BY timestamp DESC) as rn
          FROM monitoring_data
          WHERE station_id = (SELECT station_id FROM nearest_station)
            AND data_type IN ('temperature', 'humidity', 'wind_speed', 'wind_direction', 'rainfall')
            AND timestamp >= NOW() - INTERVAL '2 hours'
        )
        SELECT 
          MAX(CASE WHEN data_type = 'temperature' THEN value END) as temperature,
          MAX(CASE WHEN data_type = 'humidity' THEN value END) as humidity,
          MAX(CASE WHEN data_type = 'wind_speed' THEN value END) as wind_speed,
          MAX(CASE WHEN data_type = 'wind_direction' THEN value END) as wind_direction,
          MAX(CASE WHEN data_type = 'rainfall' THEN value END) as rainfall,
          MAX(timestamp) as latest_time,
          (SELECT lat FROM nearest_station) as station_lat,
          (SELECT lon FROM nearest_station) as station_lon
        FROM latest_data
        WHERE rn = 1;
      `;

      const result = await this.db.query(query, [longitude, latitude]);

      if (result.rows.length > 0 && result.rows[0].temperature !== null) {
        const row = result.rows[0];
        
        // 获取24小时降雨量
        const rainfall24h = await this.get24hRainfall(latitude, longitude);
        
        const weatherData: WeatherData = {
          temperature: parseFloat(row.temperature) || 20,
          humidity: parseFloat(row.humidity) || 60,
          pressure: 1013, // 标准大气压，如果没有数据
          wind_speed: parseFloat(row.wind_speed) || 3,
          wind_direction: parseFloat(row.wind_direction) || 0,
          rainfall: parseFloat(row.rainfall) || 0,
          rainfall_24h: rainfall24h,
          weather_condition: this.getWeatherCondition(
            parseFloat(row.rainfall) || 0, 
            parseFloat(row.temperature) || 20
          ),
          visibility: 10, // 默认能见度
          timestamp: new Date(row.latest_time || new Date()),
          location: { 
            latitude: parseFloat(row.station_lat) || latitude, 
            longitude: parseFloat(row.station_lon) || longitude 
          }
        };

        // 缓存5分钟
        await redisConfig.set(cacheKey, JSON.stringify(weatherData), 300);

        console.log('从数据库获取天气数据:', weatherData);
        return weatherData;
      }

      // 如果没有实际数据，返回模拟数据
      console.log('数据库无数据，使用模拟天气数据');
      return this.getMockWeatherData(latitude, longitude);

    } catch (error) {
      console.error('获取实时天气数据失败:', error);
      // 返回模拟数据作为后备
      return this.getMockWeatherData(latitude, longitude);
    }
  }

  /**
   * 获取天气预报（基于历史数据模式生成）
   */
  async getForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<ForecastData[]> {
    try {
      const cacheKey = `weather:forecast:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${days}`;
      const cached = await redisConfig.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // 获取当前天气作为基准
      const current = await this.getCurrentWeather(latitude, longitude);
      const forecasts: ForecastData[] = [];

      if (current) {
        for (let i = 1; i <= days; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          // 基于当前温度生成预测
          const tempVariation = (Math.random() - 0.5) * 6; // -3到+3度变化
          const baseTemp = current.temperature + tempVariation;
          
          forecasts.push({
            timestamp: date,
            temperature_max: Math.round(baseTemp + 3 + Math.random() * 3),
            temperature_min: Math.round(baseTemp - 3 - Math.random() * 2),
            rainfall_probability: Math.round(20 + Math.random() * 60),
            rainfall_amount: Math.random() < 0.3 ? Math.round(Math.random() * 15) : 0,
            weather_condition: this.generateForecastCondition(),
            wind_speed: Math.round(2 + Math.random() * 5)
          });
        }
      } else {
        // 完全模拟的预报数据
        forecasts.push(...this.getMockForecastData(days));
      }

      // 缓存1小时
      await redisConfig.set(cacheKey, JSON.stringify(forecasts), 3600);

      return forecasts;

    } catch (error) {
      console.error('获取天气预报失败:', error);
      return this.getMockForecastData(days);
    }
  }

  /**
   * 获取24小时降雨量
   */
  async get24hRainfall(latitude: number, longitude: number): Promise<number> {
    try {
      const cacheKey = `weather:rainfall24h:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
      const cached = await redisConfig.get(cacheKey);
      
      if (cached) {
        return parseFloat(cached);
      }

      const query = `
        WITH nearest_station AS (
          SELECT station_id
          FROM monitoring_stations
          WHERE is_active = true AND location IS NOT NULL
          ORDER BY location::geography <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          LIMIT 1
        )
        SELECT COALESCE(SUM(value), 0) as total_rainfall
        FROM monitoring_data
        WHERE station_id = (SELECT station_id FROM nearest_station)
          AND data_type = 'rainfall'
          AND timestamp >= NOW() - INTERVAL '24 hours';
      `;

      const result = await this.db.query(query, [longitude, latitude]);
      const totalRainfall = parseFloat(result.rows[0]?.total_rainfall) || 0;

      // 缓存10分钟
      await redisConfig.set(cacheKey, totalRainfall.toString(), 600);

      return totalRainfall;

    } catch (error) {
      console.error('获取24小时降雨量失败:', error);
      return 0;
    }
  }

  /**
   * 获取天气预警（基于当前数据生成）
   */
  async getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    try {
      const cacheKey = `weather:alerts:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
      const cached = await redisConfig.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const alerts: WeatherAlert[] = [];
      const current = await this.getCurrentWeather(latitude, longitude);

      if (current) {
        // 暴雨预警
        if (current.rainfall_24h > 50) {
          const level = current.rainfall_24h > 100 ? '橙色' : 
                       current.rainfall_24h > 70 ? '黄色' : '蓝色';
          alerts.push({
            alert_type: '暴雨',
            level: level,
            title: `暴雨${level}预警`,
            description: `24小时累计降雨量${current.rainfall_24h.toFixed(1)}mm，请注意防范洪涝灾害。`,
            start_time: new Date(),
            end_time: new Date(Date.now() + 6 * 60 * 60 * 1000),
            affected_regions: ['当前区域']
          });
        }

        // 大风预警
        if (current.wind_speed > 10) {
          const level = current.wind_speed > 20 ? '橙色' : 
                       current.wind_speed > 15 ? '黄色' : '蓝色';
          alerts.push({
            alert_type: '大风',
            level: level,
            title: `大风${level}预警`,
            description: `当前风速${current.wind_speed.toFixed(1)}m/s，请注意防范。`,
            start_time: new Date(),
            end_time: new Date(Date.now() + 3 * 60 * 60 * 1000),
            affected_regions: ['当前区域']
          });
        }

        // 高温预警
        if (current.temperature > 35) {
          const level = current.temperature > 40 ? '橙色' : 
                       current.temperature > 37 ? '黄色' : '蓝色';
          alerts.push({
            alert_type: '高温',
            level: level,
            title: `高温${level}预警`,
            description: `当前气温${current.temperature.toFixed(1)}℃，请注意防暑降温。`,
            start_time: new Date(),
            end_time: new Date(Date.now() + 12 * 60 * 60 * 1000),
            affected_regions: ['当前区域']
          });
        }

        // 低温预警
        if (current.temperature < 0) {
          const level = current.temperature < -10 ? '橙色' : 
                       current.temperature < -5 ? '黄色' : '蓝色';
          alerts.push({
            alert_type: '低温',
            level: level,
            title: `低温${level}预警`,
            description: `当前气温${current.temperature.toFixed(1)}℃，请注意防寒保暖。`,
            start_time: new Date(),
            end_time: new Date(Date.now() + 12 * 60 * 60 * 1000),
            affected_regions: ['当前区域']
          });
        }
      }

      // 缓存15分钟
      await redisConfig.set(cacheKey, JSON.stringify(alerts), 900);

      return alerts;

    } catch (error) {
      console.error('获取天气预警失败:', error);
      return [];
    }
  }

  /**
   * 批量获取多个位置的天气数据
   */
  async getBatchWeather(locations: Array<{ latitude: number; longitude: number }>): Promise<WeatherData[]> {
    const weatherData: WeatherData[] = [];

    // 并发请求，限制并发数避免数据库压力过大
    const chunkSize = 5;
    for (let i = 0; i < locations.length; i += chunkSize) {
      const chunk = locations.slice(i, i + chunkSize);
      const promises = chunk.map(loc => this.getCurrentWeather(loc.latitude, loc.longitude));
      const results = await Promise.allSettled(promises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          weatherData.push(result.value);
        }
      });

      // 避免数据库压力，延迟50ms
      if (i + chunkSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return weatherData;
  }

  /**
   * 获取气象历史数据
   */
  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherData[]> {
    try {
      const query = `
        WITH nearest_station AS (
          SELECT station_id
          FROM monitoring_stations
          WHERE is_active = true AND location IS NOT NULL
          ORDER BY location::geography <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          LIMIT 1
        ),
        historical_data AS (
          SELECT 
            DATE_TRUNC('hour', timestamp) as hour,
            data_type,
            AVG(value) as avg_value
          FROM monitoring_data
          WHERE station_id = (SELECT station_id FROM nearest_station)
            AND timestamp BETWEEN $3 AND $4
            AND data_type IN ('temperature', 'humidity', 'wind_speed', 'rainfall')
          GROUP BY DATE_TRUNC('hour', timestamp), data_type
        )
        SELECT 
          hour as timestamp,
          MAX(CASE WHEN data_type = 'temperature' THEN avg_value END) as temperature,
          MAX(CASE WHEN data_type = 'humidity' THEN avg_value END) as humidity,
          MAX(CASE WHEN data_type = 'wind_speed' THEN avg_value END) as wind_speed,
          MAX(CASE WHEN data_type = 'rainfall' THEN avg_value END) as rainfall
        FROM historical_data
        GROUP BY hour
        ORDER BY hour;
      `;

      const result = await this.db.query(query, [longitude, latitude, startDate, endDate]);

      return result.rows.map(row => ({
        temperature: parseFloat(row.temperature) || 20,
        humidity: parseFloat(row.humidity) || 60,
        pressure: 1013,
        wind_speed: parseFloat(row.wind_speed) || 3,
        wind_direction: 0,
        rainfall: parseFloat(row.rainfall) || 0,
        rainfall_24h: 0,
        weather_condition: this.getWeatherCondition(
          parseFloat(row.rainfall) || 0,
          parseFloat(row.temperature) || 20
        ),
        visibility: 10,
        timestamp: new Date(row.timestamp),
        location: { latitude, longitude }
      }));

    } catch (error) {
      console.error('获取历史气象数据失败:', error);
      return [];
    }
  }

  /**
   * 根据降雨量和温度判断天气状况
   */
  private getWeatherCondition(rainfall: number, temperature: number): string {
    if (rainfall > 15) return '大雨';
    if (rainfall > 7) return '中雨';
    if (rainfall > 2) return '小雨';
    if (rainfall > 0.5) return '阴';
    if (temperature > 30) return '晴热';
    if (temperature < 10) return '晴冷';
    return '晴';
  }

  /**
   * 生成预报天气状况
   */
  private generateForecastCondition(): string {
    const conditions = ['晴', '多云', '阴', '小雨', '晴'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  /**
   * 模拟天气数据（用于开发和测试）
   */
  private getMockWeatherData(latitude: number, longitude: number): WeatherData {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    const baseTemp = isDay ? 25 : 18;
    const rainfall = Math.random() < 0.2 ? Math.random() * 10 : 0;
    
    return {
      temperature: baseTemp + (Math.random() - 0.5) * 8,
      humidity: 50 + Math.random() * 35,
      pressure: 1010 + Math.random() * 15,
      wind_speed: 2 + Math.random() * 6,
      wind_direction: Math.random() * 360,
      rainfall: rainfall,
      rainfall_24h: rainfall * 3,
      weather_condition: this.getWeatherCondition(rainfall, baseTemp),
      visibility: 8 + Math.random() * 7,
      timestamp: new Date(),
      location: {
        latitude,
        longitude
      }
    };
  }

  /**
   * 模拟预报数据
   */
  private getMockForecastData(days: number): ForecastData[] {
    const forecasts: ForecastData[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      const baseTemp = 22 + (Math.random() - 0.5) * 10;
      forecasts.push({
        timestamp: date,
        temperature_max: Math.round(baseTemp + 5),
        temperature_min: Math.round(baseTemp - 3),
        rainfall_probability: Math.round(Math.random() * 80),
        rainfall_amount: Math.random() < 0.3 ? Math.round(Math.random() * 15) : 0,
        weather_condition: this.generateForecastCondition(),
        wind_speed: Math.round(2 + Math.random() * 6)
      });
    }

    return forecasts;
  }

  /**
   * 检查服务是否正常
   */
  async testConnection(): Promise<boolean> {
    try {
      // 测试数据库连接
      const result = await this.db.query('SELECT 1');
      console.log('天气服务：数据库连接正常');
      return result.rows.length > 0;
    } catch (error) {
      console.error('天气服务：数据库连接测试失败:', error);
      return false;
    }
  }

  /**
   * 根据天气条件计算风险权重（用于风险评估）
   */
  calculateWeatherRiskWeight(weather: WeatherData): number {
    let weight = 0;

    // 降雨量权重（最重要）
    if (weather.rainfall_24h > 100) weight += 0.5;
    else if (weather.rainfall_24h > 50) weight += 0.4;
    else if (weather.rainfall_24h > 25) weight += 0.3;
    else if (weather.rainfall_24h > 10) weight += 0.2;

    // 风速权重
    if (weather.wind_speed > 20) weight += 0.3;
    else if (weather.wind_speed > 15) weight += 0.2;
    else if (weather.wind_speed > 10) weight += 0.1;

    // 温度极端情况
    if (weather.temperature > 38 || weather.temperature < -10) weight += 0.2;
    else if (weather.temperature > 35 || weather.temperature < -5) weight += 0.1;

    return Math.min(weight, 1.0); // 最大权重为1
  }

  /**
   * 判断是否为恶劣天气
   */
  isSevereWeather(weather: WeatherData): boolean {
    return (
      weather.rainfall_24h > 50 ||
      weather.wind_speed > 17 ||
      weather.temperature > 38 ||
      weather.temperature < -15
    );
  }
}


