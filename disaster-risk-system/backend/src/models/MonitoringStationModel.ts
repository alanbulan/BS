import { BaseModel } from './BaseModel';
import { MonitoringStation } from '../types';
import { Pool } from 'pg';

export interface CreateMonitoringStationData {
  station_id: string
  name: string
  location: any
  station_type: string
  monitoring_type?: string
  address?: string
  elevation?: number
  equipment_info?: any
  installation_date?: Date
  installation_status?: string
  maintenance_schedule?: any
  data_transmission_interval?: number
  power_source?: string
  communication_method?: string
  contact_info?: any
  technical_specs?: any
  is_active?: boolean
  zone_id?: number
  last_maintenance_date?: Date
  next_maintenance_date?: Date
  [key: string]: any
}

export interface UpdateMonitoringStationData {
  station_id?: string
  name?: string
  location?: any
  station_type?: string
  monitoring_type?: string
  address?: string
  elevation?: number
  equipment_info?: any
  installation_date?: Date
  installation_status?: string
  maintenance_schedule?: any
  data_transmission_interval?: number
  power_source?: string
  communication_method?: string
  contact_info?: any
  technical_specs?: any
  is_active?: boolean
  zone_id?: number
  last_maintenance_date?: Date
  next_maintenance_date?: Date
  [key: string]: any
}

export class MonitoringStationModel extends BaseModel {
  constructor() {
    super('monitoring_stations');
  }
  /**
   * 分页查询监测站
   */
  async paginate(
    page: number,
    limit: number,
    conditions: any = {},
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
  ): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number; } }> {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // 构建查询条件
      if (conditions.search) {
        whereClause += ` AND (ms.name ILIKE $${paramIndex} OR ms.station_id ILIKE $${paramIndex + 1})`;
        params.push(`%${conditions.search}%`, `%${conditions.search}%`);
        paramIndex += 2;
      }
      if (conditions.station_type) {
        whereClause += ` AND ms.station_type = $${paramIndex++}`;
        params.push(conditions.station_type);
      }

      if (conditions.zone_id) {
        whereClause += ` AND ms.zone_id = $${paramIndex++}`;
        params.push(conditions.zone_id);
      }
      if (conditions.is_active !== undefined) {
        whereClause += ` AND ms.is_active = $${paramIndex++}`;
        params.push(conditions.is_active);
      }
      if (conditions.installation_status) {
        whereClause += ` AND ms.installation_status = $${paramIndex++}`;
        params.push(conditions.installation_status);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM monitoring_stations ms ${whereClause}`;
      const countResult = await this.executeQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // 获取分页数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT 
          ms.*,
          rz.name as zone_name,
          rz.base_risk_level,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude,
          ST_AsText(ms.location) as location_wkt,
          (
            SELECT MAX(md.timestamp) 
            FROM monitoring_data md 
            WHERE md.station_id = ms.station_id
          ) as last_data_time
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        ${whereClause}
        ORDER BY ms.${sortBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);
      
      const dataResult = await this.executeQuery(dataQuery, params);
      

      
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('分页查询监测站失败:', error);
      throw error;
    }
  }



  /**
   * 根据站点ID查找监测站
   */
  async findByStationId(stationId: string): Promise<MonitoringStation | null> {
    try {
      const query = `
        SELECT 
          ms.*,
          rz.name as zone_name,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude,
          ST_AsText(ms.location) as location_wkt
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        WHERE ms.station_id = $1
      `;
      const result = await this.executeQuery(query, [stationId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('根据站点ID查找监测站失败:', error);
      throw error;
    }
  }

  /**
   * 创建监测站
   */
  async create(data: CreateMonitoringStationData): Promise<MonitoringStation> {
    try {
      const fields = [];
      const values = [];
      const params = [];
      let paramIndex = 1;

      // 处理经纬度转换为PostGIS POINT
      if (data.longitude !== undefined && data.latitude !== undefined) {
        fields.push('location');
        values.push(`ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)`);
        params.push(data.longitude, data.latitude);
        paramIndex += 2;
      }

      // 处理所有字段
      const allowedFields = [
        'station_id', 'name', 'station_type', 'monitoring_type',
        'address', 'zone_id', 'elevation', 'installation_date', 'installation_status',
        'maintenance_schedule', 'contact_info', 'technical_specs', 
        'data_transmission_interval', 'power_source', 'communication_method',
        'is_active', 'last_maintenance_date', 'next_maintenance_date'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(field);
          values.push(`$${paramIndex++}`);
          params.push(data[field]);
        }
      }

      const query = `
        INSERT INTO monitoring_stations (${fields.join(', ')})
        VALUES (${values.join(', ')})
        RETURNING *
      `;

      const result = await this.executeQuery(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('创建监测站失败:', error);
      throw error;
    }
  }

  /**
   * 更新监测站
   */
  async update(id: number, data: UpdateMonitoringStationData): Promise<MonitoringStation | null> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 处理经纬度转换为PostGIS POINT
      if (data.longitude !== undefined && data.latitude !== undefined) {
        updateFields.push(`location = ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)`);
        values.push(data.longitude, data.latitude);
        paramIndex += 2;
      }

      const allowedFields = [
        'station_id', 'name', 'station_type', 'monitoring_type',
        'address', 'zone_id', 'elevation', 'installation_date', 'installation_status',
        'maintenance_schedule', 'contact_info', 'technical_specs', 
        'data_transmission_interval', 'power_source', 'communication_method',
        'is_active', 'last_maintenance_date', 'next_maintenance_date'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(data[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return this.findById(id);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `
        UPDATE monitoring_stations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await this.executeQuery(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('更新监测站失败:', error);
      throw error;
    }
  }

  /**
   * 删除监测站
   */
  async delete(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM monitoring_stations WHERE id = $1';
      const result = await this.executeQuery(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('删除监测站失败:', error);
      throw error;
    }
  }

  /**
   * 根据区域获取监测站
   */
  async getStationsByZone(zoneId: number): Promise<MonitoringStation[]> {
    try {
      const query = `
        SELECT 
          ms.*,
          rz.name as zone_name,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        WHERE ms.zone_id = $1
        ORDER BY ms.name
      `;
      const result = await this.executeQuery(query, [zoneId]);
      return result.rows;
    } catch (error) {
      console.error('根据区域获取监测站失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新监测站状态
   */
  async batchUpdateStatus(stationIds: number[], updates: any): Promise<number> {
    try {
      const updateFields = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (typeof updates.is_active === 'boolean') {
        updateFields.push(`is_active = $${paramIndex++}`);
        params.push(updates.is_active);
      }

      if (updates.installation_status) {
        updateFields.push(`installation_status = $${paramIndex++}`);
        params.push(updates.installation_status);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      const placeholders = stationIds.map((_, index) => `$${paramIndex + index}`).join(',');
      params.push(...stationIds);

      const query = `
        UPDATE monitoring_stations 
        SET ${updateFields.join(', ')}
        WHERE id IN (${placeholders})
      `;
      
      const result = await this.executeQuery(query, params);
      return result.rowCount || 0;
    } catch (error) {
      console.error('批量更新监测站状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取活跃监测站列表
   */
  async getActiveStations(): Promise<MonitoringStation[]> {
    try {
      const query = `
        SELECT 
          ms.*,
          rz.name as zone_name,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        WHERE ms.is_active = true
        ORDER BY ms.name
      `;
      const result = await this.executeQuery(query);
      return result.rows;
    } catch (error) {
      console.error('获取活跃监测站列表失败:', error);
      throw error;
    }
  }

  /**
   * 重写findById方法，处理PostGIS location字段
   */
  async findById(id: number): Promise<MonitoringStation | null> {
    try {
      const query = `
        SELECT 
          ms.*,
          rz.name as zone_name,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude,
          (
            SELECT COUNT(*) 
            FROM monitoring_data md 
            WHERE md.station_id = ms.station_id 
            AND md.timestamp >= NOW() - INTERVAL '24 hours'
          ) as data_count_24h,
          (
            SELECT MAX(md.timestamp) 
            FROM monitoring_data md 
            WHERE md.station_id = ms.station_id
          ) as last_data_time
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        WHERE ms.id = $1
      `;
      const result = await this.executeQuery(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('根据ID获取监测站失败:', error);
      throw error;
    }
  }

  /**
   * 获取监测站统计信息
   */
  async getStationStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_stations,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_stations,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_stations,
          COUNT(DISTINCT station_type) as station_types,
          COUNT(DISTINCT monitoring_type) as monitoring_types,
          COUNT(DISTINCT zone_id) as zones_covered,
          COUNT(CASE WHEN installation_status = 'installed' THEN 1 END) as installed_stations,
          COUNT(CASE WHEN installation_status = 'maintenance' THEN 1 END) as maintenance_stations,
          COUNT(CASE WHEN next_maintenance_date <= CURRENT_DATE THEN 1 END) as overdue_maintenance
        FROM monitoring_stations
      `;
      const result = await this.executeQuery(query);
      return result.rows[0];
    } catch (error) {
      console.error('获取监测站统计信息失败:', error);
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