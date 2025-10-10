/**
 * 监测数据生成服务
 * 为监测站点定期生成模拟的气象监测数据
 * 用于演示和开发环境
 */

import { Pool } from 'pg';
import * as cron from 'node-cron';

interface StationInfo {
  station_id: string;
  name: string;
  station_type: string;
  latitude: number;
  longitude: number;
}

export class MonitoringDataGeneratorService {
  private db: Pool;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  // 所有监测数据类型及其合理范围
  private dataTypes = {
    // 气象类
    temperature: { min: -10, max: 40, unit: '°C' },
    humidity: { min: 20, max: 100, unit: '%' },
    rainfall: { min: 0, max: 15, unit: 'mm' },
    wind_speed: { min: 0, max: 20, unit: 'm/s' },
    wind_direction: { min: 0, max: 360, unit: '度' },
    
    // 地质类
    groundwater_level: { min: 2, max: 15, unit: 'm' },      // 地下水位
    soil_moisture: { min: 10, max: 60, unit: '%' },         // 土壤湿度
    slope_displacement: { min: 0, max: 5, unit: 'mm' },     // 坡面位移
    seismic_acceleration: { min: 0, max: 2, unit: 'm/s²' }, // 地震加速度
    water_level: { min: 0, max: 10, unit: 'm' }             // 水位
  };

  // 监测站类型与数据类型的映射
  private stationTypeDataMapping: Record<string, string[]> = {
    rainfall: ['rainfall', 'temperature', 'humidity'],
    groundwater: ['groundwater_level', 'temperature', 'soil_moisture'],
    soil_moisture: ['soil_moisture', 'temperature', 'humidity'],
    slope: ['slope_displacement', 'rainfall', 'soil_moisture'],
    seismic: ['seismic_acceleration'],
    water_level: ['water_level', 'rainfall'],
    weather: ['temperature', 'humidity', 'rainfall', 'wind_speed', 'wind_direction'],
    wind: ['wind_speed', 'wind_direction', 'temperature']
  };

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * 启动自动数据生成
   * @param cronExpression cron表达式，默认每5分钟生成一次
   */
  start(cronExpression: string = '*/5 * * * *'): void {
    if (this.isRunning) {
      console.log('监测数据生成服务已在运行中');
      return;
    }

    // 立即生成一次数据
    this.generateData().catch(err => {
      console.error('初始数据生成失败:', err);
    });

    // 设置定时任务
    this.cronJob = cron.schedule(cronExpression, async () => {
      try {
        await this.generateData();
      } catch (error) {
        console.error('自动生成监测数据失败:', error);
      }
    });

    this.isRunning = true;
    console.log(`监测数据生成服务已启动 (${cronExpression})`);
  }

  /**
   * 停止自动数据生成
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('监测数据生成服务已停止');
  }

  /**
   * 生成监测数据
   */
  private async generateData(): Promise<void> {
    try {
      // 获取所有活跃的监测站点
      const stations = await this.getActiveStations();
      
      if (stations.length === 0) {
        console.log('没有活跃的监测站点');
        return;
      }

      const timestamp = new Date();
      let totalInserted = 0;

      // 为每个站点生成数据
      for (const station of stations) {
        const dataCount = await this.generateStationData(station, timestamp);
        totalInserted += dataCount;
      }

      console.log(`成功生成 ${totalInserted} 条监测数据 (${stations.length} 个站点)`);
    } catch (error) {
      console.error('生成监测数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取活跃的监测站点
   */
  private async getActiveStations(): Promise<StationInfo[]> {
    const query = `
      SELECT 
        station_id,
        name,
        station_type,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM monitoring_stations
      WHERE is_active = true
        AND location IS NOT NULL
      ORDER BY station_id;
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => ({
      station_id: row.station_id,
      name: row.name,
      station_type: row.station_type,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude)
    }));
  }

  /**
   * 为单个站点生成数据（根据站点类型生成对应数据）
   */
  private async generateStationData(station: StationInfo, timestamp: Date): Promise<number> {
    const values: any[] = [];
    
    // 根据站点类型获取应生成的数据类型
    const dataTypesToGenerate = this.stationTypeDataMapping[station.station_type] || ['temperature', 'humidity'];
    
    // 获取站点最近的历史数据作为基准
    const lastData = await this.getLastStationData(station.station_id);
    
    // 只为该站点类型对应的数据类型生成值
    for (const dataType of dataTypesToGenerate) {
      const range = this.dataTypes[dataType as keyof typeof this.dataTypes];
      if (!range) continue; // 跳过未定义的类型
      
      let value: number;
      
      // 如果有历史数据，基于历史数据生成（模拟连续性）
      if (lastData[dataType] !== undefined) {
        value = this.generateContinuousValue(
          lastData[dataType],
          range.min,
          range.max
        );
      } else {
        // 没有历史数据，随机生成
        value = this.generateRealisticValue(dataType, station);
      }

      // 生成raw_data（原始传感器数据）
      const rawData = {
        sensor_id: `${station.station_id}_${dataType}`,
        raw_value: value,
        sensor_status: 'normal',
        battery_level: 85 + Math.random() * 15, // 电池85-100%
        signal_strength: -50 - Math.random() * 30, // 信号强度 dBm
        reading_time: timestamp.toISOString()
      };

      // 生成processed_data（处理后的数据）
      const processedData = {
        validated_value: value,
        quality_score: 0.9 + Math.random() * 0.1, // 质量评分0.9-1.0
        anomaly_detected: value > range.max * 0.9 || value < range.min * 1.1 ? true : false,
        trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        confidence: 0.85 + Math.random() * 0.15
      };

      values.push({
        station_id: station.station_id,
        data_type: dataType,
        value: value,
        unit: range.unit,
        timestamp: timestamp,
        quality_flag: 1,
        raw_data: rawData,
        processed_data: processedData
      });
    }

    // 批量插入数据
    const insertQuery = `
      INSERT INTO monitoring_data 
        (station_id, data_type, value, unit, timestamp, quality_flag, raw_data, processed_data)
      VALUES 
        ${values.map((_, i) => 
          `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
        ).join(', ')}
    `;

    const insertValues = values.flatMap(v => [
      v.station_id,
      v.data_type,
      v.value,
      v.unit,
      v.timestamp,
      v.quality_flag,
      JSON.stringify(v.raw_data),
      JSON.stringify(v.processed_data)
    ]);

    await this.db.query(insertQuery, insertValues);
    
    return values.length;
  }

  /**
   * 获取站点最近的数据
   */
  private async getLastStationData(stationId: string): Promise<Record<string, number>> {
    const query = `
      SELECT DISTINCT ON (data_type)
        data_type,
        value
      FROM monitoring_data
      WHERE station_id = $1
        AND timestamp >= NOW() - INTERVAL '1 hour'
      ORDER BY data_type, timestamp DESC;
    `;

    const result = await this.db.query(query, [stationId]);
    
    const lastData: Record<string, number> = {};
    result.rows.forEach(row => {
      lastData[row.data_type] = parseFloat(row.value);
    });
    
    return lastData;
  }

  /**
   * 生成连续变化的值（基于上一次的值）
   */
  private generateContinuousValue(lastValue: number, min: number, max: number): number {
    // 生成小幅度的变化（±10%）
    const changePercent = (Math.random() - 0.5) * 0.2; // -0.1 到 0.1
    let newValue = lastValue * (1 + changePercent);
    
    // 确保在合理范围内
    newValue = Math.max(min, Math.min(max, newValue));
    
    // 保留2位小数
    return Math.round(newValue * 100) / 100;
  }

  /**
   * 生成符合真实情况的初始值
   */
  private generateRealisticValue(dataType: string, station: StationInfo): number {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    const { min, max } = this.dataTypes[dataType as keyof typeof this.dataTypes];
    
    let value: number;
    
    switch (dataType) {
      case 'temperature':
        // 白天较热，晚上较冷
        const baseTemp = 20;
        const dayVariation = isDay ? 8 : -5;
        value = baseTemp + dayVariation + (Math.random() - 0.5) * 10;
        break;
        
      case 'humidity':
        // 湿度通常在40-80%
        value = 40 + Math.random() * 40;
        break;
        
      case 'rainfall':
        // 大部分时间不下雨，偶尔有降雨
        if (Math.random() < 0.15) {
          value = Math.random() * 10;
        } else {
          value = 0;
        }
        break;
        
      case 'wind_speed':
        // 风速通常较小
        value = 2 + Math.random() * 6;
        break;
        
      case 'wind_direction':
        // 风向随机
        value = Math.random() * 360;
        break;
        
      case 'groundwater_level':
        // 地下水位（米），通常在5-12米
        value = 5 + Math.random() * 7;
        break;
        
      case 'soil_moisture':
        // 土壤湿度（%），通常20-50%
        value = 20 + Math.random() * 30;
        // 下雨时湿度增加
        if (Math.random() < 0.1) value += 10;
        break;
        
      case 'slope_displacement':
        // 坡面位移（毫米），通常很小，偶尔有异常
        if (Math.random() < 0.05) {
          // 5%概率有明显位移（危险信号）
          value = 1 + Math.random() * 4;
        } else {
          value = Math.random() * 0.5; // 正常微小位移
        }
        break;
        
      case 'seismic_acceleration':
        // 地震加速度（m/s²），大部分时间接近0
        if (Math.random() < 0.01) {
          // 1%概率有地震活动
          value = 0.1 + Math.random() * 1.9;
        } else {
          value = Math.random() * 0.05; // 背景噪声
        }
        break;
        
      case 'water_level':
        // 水位（米），通常2-8米
        value = 2 + Math.random() * 6;
        // 降雨时水位升高
        if (Math.random() < 0.2) value += 1;
        break;
        
      default:
        value = min + Math.random() * (max - min);
    }
    
    // 确保在范围内并保留2位小数
    value = Math.max(min, Math.min(max, value));
    return Math.round(value * 100) / 100;
  }

  /**
   * 手动触发一次数据生成
   */
  async generateOnce(): Promise<void> {
    await this.generateData();
  }

  /**
   * 清理旧数据（保留最近N天的数据）
   */
  async cleanOldData(daysToKeep: number = 30): Promise<number> {
    try {
      const query = `
        DELETE FROM monitoring_data
        WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING id;
      `;
      
      const result = await this.db.query(query);
      const deletedCount = result.rowCount || 0;
      
      if (deletedCount > 0) {
        console.log(`清理了 ${deletedCount} 条超过 ${daysToKeep} 天的旧数据`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('清理旧数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取服务状态
   */
  getStatus(): { running: boolean; stations: number } {
    return {
      running: this.isRunning,
      stations: 0 // 可以缓存站点数量
    };
  }
}

