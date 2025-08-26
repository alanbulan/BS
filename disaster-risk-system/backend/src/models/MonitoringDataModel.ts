import { BaseModel } from './BaseModel';
import { MonitoringData, TimeRangeQuery } from '../types';
import { Pool } from 'pg';

export class MonitoringDataModel extends BaseModel {
  constructor() {
    super('monitoring_data');
  }

  /**
   * 创建监测数据
   */
  async create(data: Omit<MonitoringData, 'id' | 'created_at'>): Promise<MonitoringData> {
    try {
      const sql = `
        INSERT INTO monitoring_data (
          station_id, data_type, value, unit, timestamp, 
          quality_flag, raw_data, processed_data, alert_threshold_min, 
          alert_threshold_max, calibration_factor, device_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const result = await this.executeQuery(sql, [
        data.station_id,
        data.data_type,
        data.value,
        data.unit || null,
        data.timestamp,
        data.quality_flag || 1,
        data.raw_data ? JSON.stringify(data.raw_data) : null,
        data.processed_data ? JSON.stringify(data.processed_data) : null,
        data.alert_threshold_min || null,
        data.alert_threshold_max || null,
        data.calibration_factor || 1.0,
        data.device_status || 'normal'
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('创建监测数据失败:', error);
      throw error;
    }
  }

  /**
   * 批量插入监测数据
   */
  async batchCreate(dataArray: Omit<MonitoringData, 'id' | 'created_at'>[]): Promise<MonitoringData[]> {
    if (dataArray.length === 0) return [];
    
    try {
      const fieldCount = 12;
      const values = dataArray.map((_, index) => {
        const baseIndex = index * fieldCount;
        const placeholders = Array.from({length: fieldCount}, (_, i) => `$${baseIndex + i + 1}`);
        return `(${placeholders.join(', ')})`;
      }).join(', ');
      
      const params = dataArray.flatMap(data => [
        data.station_id,
        data.data_type,
        data.value,
        data.unit || null,
        data.timestamp,
        data.quality_flag || 1,
        data.raw_data ? JSON.stringify(data.raw_data) : null,
        data.processed_data ? JSON.stringify(data.processed_data) : null,
        data.alert_threshold_min || null,
        data.alert_threshold_max || null,
        data.calibration_factor || 1.0,
        data.device_status || 'normal'
      ]);
      
      const sql = `
        INSERT INTO monitoring_data (
          station_id, data_type, value, unit, timestamp, 
          quality_flag, raw_data, processed_data, alert_threshold_min, 
          alert_threshold_max, calibration_factor, device_status
        )
        VALUES ${values}
        RETURNING *
      `;
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('批量创建监测数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据站点ID获取最新数据
   */
  async getLatestDataByStation(stationId: string, dataType?: string, limit: number = 10): Promise<MonitoringData[]> {
    try {
      let sql = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        WHERE md.station_id = $1
      `;
      const params = [stationId];
      
      if (dataType) {
        sql += ' AND md.data_type = $2';
        params.push(dataType);
        sql += ` ORDER BY md.timestamp DESC LIMIT $3`;
        params.push(limit.toString());
      } else {
        sql += ` ORDER BY md.timestamp DESC LIMIT $2`;
        params.push(limit.toString());
      }
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('根据站点ID获取最新数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据时间范围获取数据
   */
  async getDataByTimeRange(
    stationId: string, 
    dataType: string, 
    timeRange: TimeRangeQuery,
    limit?: number
  ): Promise<MonitoringData[]> {
    try {
      let sql = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        WHERE md.station_id = $1 AND md.data_type = $2
      `;
      const params = [stationId, dataType];
      
      if (timeRange.start_time) {
        sql += ` AND md.timestamp >= $${params.length + 1}`;
        params.push(timeRange.start_time.toISOString());
      }
      
      if (timeRange.end_time) {
        sql += ` AND md.timestamp <= $${params.length + 1}`;
        params.push(timeRange.end_time.toISOString());
      }
      
      sql += ' ORDER BY md.timestamp ASC';
      
      if (limit) {
        sql += ` LIMIT $${params.length + 1}`;
        params.push(limit.toString());
      }
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('根据时间范围获取数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据统计信息
   */
  async getDataStatistics(stationId: string, dataType: string, hours: number = 24): Promise<any> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as data_count,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          STDDEV(value) as std_deviation,
          MIN(timestamp) as earliest_time,
          MAX(timestamp) as latest_time,
          COUNT(CASE WHEN quality_flag >= 3 THEN 1 END) as high_quality_count,
          COUNT(CASE WHEN device_status != 'normal' THEN 1 END) as abnormal_device_count
        FROM monitoring_data 
        WHERE station_id = $1 
          AND data_type = $2 
          AND timestamp >= NOW() - INTERVAL '$3 hours'
          AND quality_flag >= 1
      `;
      
      const result = await this.executeQuery(sql, [stationId, dataType, hours]);
      return result.rows[0];
    } catch (error) {
      console.error('获取数据统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取异常数据
   */
  async getAnomalousData(stationId?: string, hours: number = 24): Promise<MonitoringData[]> {
    try {
      let sql = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        WHERE md.timestamp >= NOW() - INTERVAL '$1 hours'
          AND (
            md.quality_flag = 0 
            OR md.device_status != 'normal'
            OR (md.alert_threshold_min IS NOT NULL AND md.value < md.alert_threshold_min)
            OR (md.alert_threshold_max IS NOT NULL AND md.value > md.alert_threshold_max)
          )
      `;
      const params: any[] = [hours];
      
      if (stationId) {
        sql += ' AND md.station_id = $2';
        params.push(stationId);
      }
      
      sql += ' ORDER BY md.timestamp DESC';
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('获取异常数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据趋势
   */
  async getDataTrend(stationId: string, dataType: string, hours: number = 24, interval: string = '1 hour'): Promise<any[]> {
    try {
      const sql = `
        SELECT 
          DATE_TRUNC($4, timestamp) as time_bucket,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as data_count,
          AVG(CASE WHEN quality_flag >= 3 THEN 1.0 ELSE 0.0 END) as quality_ratio
        FROM monitoring_data 
        WHERE station_id = $1 
          AND data_type = $2 
          AND timestamp >= NOW() - INTERVAL '$3 hours'
          AND quality_flag >= 1
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
      `;
      
      const result = await this.executeQuery(sql, [stationId, dataType, hours, interval]);
      return result.rows;
    } catch (error) {
      console.error('获取数据趋势失败:', error);
      throw error;
    }
  }

  /**
   * 获取多站点对比数据
   */
  async getMultiStationData(stationIds: string[], dataType: string, hours: number = 24): Promise<any[]> {
    if (stationIds.length === 0) return [];
    
    try {
      const placeholders = stationIds.map((_, index) => `$${index + 3}`).join(', ');
      const sql = `
        SELECT 
          md.station_id,
          ms.name as station_name,
          ms.station_type,
          AVG(md.value) as avg_value,
          MIN(md.value) as min_value,
          MAX(md.value) as max_value,
          COUNT(*) as data_count,
          MAX(md.timestamp) as latest_time
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        WHERE md.station_id IN (${placeholders})
          AND md.data_type = $1
          AND md.timestamp >= NOW() - INTERVAL '$2 hours'
          AND md.quality_flag >= 1
        GROUP BY md.station_id, ms.name, ms.station_type
        ORDER BY md.station_id
      `;
      
      const result = await this.executeQuery(sql, [dataType, hours, ...stationIds]);
      return result.rows;
    } catch (error) {
      console.error('获取多站点对比数据失败:', error);
      throw error;
    }
  }

  /**
   * 删除过期数据
   */
  async deleteExpiredData(daysToKeep: number = 90): Promise<number> {
    try {
      const sql = `
        DELETE FROM monitoring_data 
        WHERE timestamp < NOW() - INTERVAL '$1 days'
      `;
      
      const result = await this.executeQuery(sql, [daysToKeep]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('删除过期数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据质量报告
   */
  async getDataQualityReport(stationId?: string, hours: number = 24): Promise<any> {
    try {
      let sql = `
        SELECT 
          data_type,
          COUNT(*) as total_records,
          COUNT(CASE WHEN quality_flag >= 3 THEN 1 END) as high_quality,
          COUNT(CASE WHEN quality_flag = 2 THEN 1 END) as medium_quality,
          COUNT(CASE WHEN quality_flag = 1 THEN 1 END) as low_quality,
          COUNT(CASE WHEN quality_flag = 0 THEN 1 END) as invalid_data,
          COUNT(CASE WHEN device_status = 'normal' THEN 1 END) as normal_device_records,
          COUNT(CASE WHEN device_status != 'normal' THEN 1 END) as abnormal_device_records,
          ROUND(COUNT(CASE WHEN quality_flag >= 2 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as quality_percentage,
          ROUND(COUNT(CASE WHEN device_status = 'normal' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as device_normal_percentage
        FROM monitoring_data 
        WHERE timestamp >= NOW() - INTERVAL '$1 hours'
      `;
      const params: any[] = [hours];
      
      if (stationId) {
        sql += ' AND station_id = $2';
        params.push(stationId);
      }
      
      sql += ' GROUP BY data_type ORDER BY data_type';
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('获取数据质量报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时数据流
   */
  async getRealTimeData(stationIds?: string[], dataTypes?: string[], limit: number = 100): Promise<MonitoringData[]> {
    try {
      let sql = `
        SELECT DISTINCT ON (md.station_id, md.data_type) 
          md.*, ms.name as station_name, ms.station_type, ms.location
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        WHERE md.timestamp >= NOW() - INTERVAL '1 hour'
      `;
      const params: any[] = [];
      
      if (stationIds && stationIds.length > 0) {
        const placeholders = stationIds.map((_, index) => `$${params.length + index + 1}`).join(', ');
        sql += ` AND md.station_id IN (${placeholders})`;
        params.push(...stationIds);
      }
      
      if (dataTypes && dataTypes.length > 0) {
        const placeholders = dataTypes.map((_, index) => `$${params.length + index + 1}`).join(', ');
        sql += ` AND md.data_type IN (${placeholders})`;
        params.push(...dataTypes);
      }
      
      sql += ` ORDER BY md.station_id, md.data_type, md.timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('获取实时数据流失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的监测数据
   */
  async getRecentData(limit: number = 10): Promise<MonitoringData[]> {
    try {
      const sql = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        ORDER BY md.timestamp DESC
        LIMIT $1
      `;
      
      const result = await this.executeQuery(sql, [limit]);
      return result.rows;
    } catch (error) {
      console.error('获取最近的监测数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据时间范围和几何区域查找数据 (为RiskAssessmentService提供)
   */
  async findByTimeRange(query: {
    startTime: Date;
    endTime: Date;
    geometry?: any;
  }): Promise<MonitoringData[]> {
    try {
      let sql = `
        SELECT md.*, ms.name as station_name, ms.station_type, ms.location
        FROM monitoring_data md
      `;
      const params = [query.startTime.toISOString(), query.endTime.toISOString()];
      let paramIndex = 3;

      // 如果提供了几何区域，通过JOIN monitoring_stations表进行空间过滤
      if (query.geometry) {
        sql += `
          INNER JOIN monitoring_stations ms ON md.station_id = ms.station_id
          WHERE md.timestamp BETWEEN $1 AND $2
            AND ST_Intersects(ms.location, ST_GeomFromGeoJSON($${paramIndex}))
            AND md.quality_flag >= 1
        `;
        params.push(JSON.stringify(query.geometry));
      } else {
        sql += `
          LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
          WHERE md.timestamp BETWEEN $1 AND $2
            AND md.quality_flag >= 1
        `;
      }

      sql += ' ORDER BY md.timestamp DESC LIMIT 1000';

      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('根据时间范围和几何区域查找数据失败:', error);
      throw error;
    }
  }

  /**
   * 删除监测数据
   */
  async deleteById(id: number): Promise<boolean> {
    try {
      const deleteQuery = 'DELETE FROM monitoring_data WHERE id = $1';
      const result = await this.executeQuery(deleteQuery, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('删除监测数据失败:', error);
      throw error;
    }
  }

  /**
   * 更新监测数据
   */
  async updateById(id: number, data: Partial<MonitoringData>): Promise<MonitoringData | null> {
    try {
      const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = fields.map(field => data[field as keyof MonitoringData]);
      
      const updateQuery = `
        UPDATE monitoring_data 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.executeQuery(updateQuery, [id, ...values]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('更新监测数据失败:', error);
      throw error;
    }
  }

  /**
   * 执行自定义查询
   */
  async customQuery(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const result = await this.executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('执行自定义查询失败:', error);
      throw error;
    }
  }
}
