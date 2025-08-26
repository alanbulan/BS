"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringStationModel = void 0;
const BaseModel_1 = require("./BaseModel");
class MonitoringStationModel extends BaseModel_1.BaseModel {
    constructor() {
        super('monitoring_stations');
    }
    async paginate(page, limit, conditions = {}, sortBy = 'created_at', sortOrder = 'DESC') {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramIndex = 1;
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
            const countQuery = `SELECT COUNT(*) as total FROM monitoring_stations ms ${whereClause}`;
            const countResult = await this.executeQuery(countQuery, params);
            const total = parseInt(countResult.rows[0].total);
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
        }
        catch (error) {
            console.error('分页查询监测站失败:', error);
            throw error;
        }
    }
    async findByStationId(stationId) {
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
        }
        catch (error) {
            console.error('根据站点ID查找监测站失败:', error);
            throw error;
        }
    }
    async create(data) {
        try {
            const fields = [];
            const values = [];
            const params = [];
            let paramIndex = 1;
            if (data.longitude !== undefined && data.latitude !== undefined) {
                fields.push('location');
                values.push(`ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)`);
                params.push(data.longitude, data.latitude);
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
        }
        catch (error) {
            console.error('创建监测站失败:', error);
            throw error;
        }
    }
    async update(id, data) {
        try {
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
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
        }
        catch (error) {
            console.error('更新监测站失败:', error);
            throw error;
        }
    }
    async delete(id) {
        try {
            const query = 'DELETE FROM monitoring_stations WHERE id = $1';
            const result = await this.executeQuery(query, [id]);
            return (result.rowCount || 0) > 0;
        }
        catch (error) {
            console.error('删除监测站失败:', error);
            throw error;
        }
    }
    async getStationsByZone(zoneId) {
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
        }
        catch (error) {
            console.error('根据区域获取监测站失败:', error);
            throw error;
        }
    }
    async batchUpdateStatus(stationIds, updates) {
        try {
            const updateFields = [];
            const params = [];
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
        }
        catch (error) {
            console.error('批量更新监测站状态失败:', error);
            throw error;
        }
    }
    async getActiveStations() {
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
        }
        catch (error) {
            console.error('获取活跃监测站列表失败:', error);
            throw error;
        }
    }
    async findById(id) {
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
        }
        catch (error) {
            console.error('根据ID获取监测站失败:', error);
            throw error;
        }
    }
    async getStationStatistics() {
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
        }
        catch (error) {
            console.error('获取监测站统计信息失败:', error);
            throw error;
        }
    }
    async customQuery(sql, params = []) {
        try {
            const result = await this.executeQuery(sql, params);
            return result.rows;
        }
        catch (error) {
            console.error('执行自定义查询失败:', error);
            throw error;
        }
    }
}
exports.MonitoringStationModel = MonitoringStationModel;
//# sourceMappingURL=MonitoringStationModel.js.map