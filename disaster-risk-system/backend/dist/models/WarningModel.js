"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningModel = void 0;
const database_1 = require("../config/database");
class WarningModel {
    static async findAll(page = 1, limit = 10, sortBy = 'issue_time', sortOrder = 'DESC', filters = {}) {
        const offset = (page - 1) * limit;
        const whereConditions = [];
        const queryParams = [];
        let paramIndex = 1;
        if (filters.zone_id) {
            whereConditions.push(`w.zone_id = $${paramIndex}`);
            queryParams.push(filters.zone_id);
            paramIndex++;
        }
        if (filters.disaster_type_id) {
            whereConditions.push(`w.disaster_type_id = $${paramIndex}`);
            queryParams.push(filters.disaster_type_id);
            paramIndex++;
        }
        if (filters.warning_level) {
            whereConditions.push(`w.warning_level = $${paramIndex}`);
            queryParams.push(filters.warning_level);
            paramIndex++;
        }
        if (filters.status) {
            whereConditions.push(`w.status = $${paramIndex}`);
            queryParams.push(filters.status);
            paramIndex++;
        }
        if (filters.evacuation_required !== undefined) {
            whereConditions.push(`w.evacuation_required = $${paramIndex}`);
            queryParams.push(filters.evacuation_required);
            paramIndex++;
        }
        if (filters.title) {
            whereConditions.push(`w.title ILIKE $${paramIndex}`);
            queryParams.push(`%${filters.title}%`);
            paramIndex++;
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const query = `
      SELECT w.*, dt.name as disaster_type_name, rz.name as zone_name,
             ST_AsText(w.affected_area) as affected_area_wkt
      FROM warnings w
      LEFT JOIN disaster_types dt ON w.disaster_type_id = dt.id
      LEFT JOIN risk_zones rz ON w.zone_id = rz.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        queryParams.push(limit, offset);
        const result = await database_1.pool.query(query, queryParams);
        return result.rows;
    }
    static async findById(id) {
        const query = `
      SELECT w.*, dt.name as disaster_type_name, rz.name as zone_name
      FROM warnings w
      LEFT JOIN disaster_types dt ON w.disaster_type_id = dt.id
      LEFT JOIN risk_zones rz ON w.zone_id = rz.id
      WHERE w.id = $1
    `;
        const result = await database_1.pool.query(query, [id]);
        return result.rows[0] || null;
    }
    static async findByWarningId(warningId) {
        const query = `
      SELECT w.*, dt.name as disaster_type_name, rz.name as zone_name
      FROM warnings w
      LEFT JOIN disaster_types dt ON w.disaster_type_id = dt.id
      LEFT JOIN risk_zones rz ON w.zone_id = rz.id
      WHERE w.warning_id = $1
    `;
        const result = await database_1.pool.query(query, [warningId]);
        return result.rows[0] || null;
    }
    static async create(data) {
        const query = `
      INSERT INTO warnings (
        warning_id, zone_id, disaster_type_id, warning_level, title, content,
        affected_area, estimated_affected_population, issue_time, effective_time,
        expiry_time, issuing_authority, contact_info, recommended_actions,
        evacuation_required, shelter_recommendations, status, update_sequence, parent_warning_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;
        const values = [
            data.warning_id,
            data.zone_id,
            data.disaster_type_id,
            data.warning_level,
            data.title,
            data.content,
            data.affected_area,
            data.estimated_affected_population,
            data.issue_time,
            data.effective_time,
            data.expiry_time,
            data.issuing_authority,
            data.contact_info ? JSON.stringify(data.contact_info) : null,
            data.recommended_actions ? JSON.stringify(data.recommended_actions) : null,
            data.evacuation_required || false,
            data.shelter_recommendations ? JSON.stringify(data.shelter_recommendations) : null,
            data.status || 'active',
            data.update_sequence || 1,
            data.parent_warning_id
        ];
        const result = await database_1.pool.query(query, values);
        return result.rows[0];
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                if (key === 'contact_info' || key === 'recommended_actions' || key === 'shelter_recommendations') {
                    values.push(value ? JSON.stringify(value) : null);
                }
                else {
                    values.push(value);
                }
                paramCount++;
            }
        });
        if (fields.length === 0) {
            return null;
        }
        values.push(id);
        const query = `
      UPDATE warnings 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await database_1.pool.query(query, values);
        return result.rows[0] || null;
    }
    static async delete(id) {
        const query = 'DELETE FROM warnings WHERE id = $1';
        const result = await database_1.pool.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
    static async findActiveWarnings() {
        const query = `
      SELECT w.*, dt.name as disaster_type_name, rz.name as zone_name,
             ST_AsText(w.affected_area) as affected_area_wkt
      FROM warnings w
      LEFT JOIN disaster_types dt ON w.disaster_type_id = dt.id
      LEFT JOIN risk_zones rz ON w.zone_id = rz.id
      WHERE w.status = 'active' AND (w.expiry_time IS NULL OR w.expiry_time > NOW())
      ORDER BY w.warning_level DESC, w.issue_time DESC
    `;
        const result = await database_1.pool.query(query);
        return result.rows;
    }
    static async findByZone(zoneId) {
        const query = `
      SELECT w.*, dt.name as disaster_type_name, rz.name as zone_name,
             ST_AsText(w.affected_area) as affected_area_wkt
      FROM warnings w
      LEFT JOIN disaster_types dt ON w.disaster_type_id = dt.id
      LEFT JOIN risk_zones rz ON w.zone_id = rz.id
      WHERE w.zone_id = $1
      ORDER BY w.issue_time DESC
    `;
        const result = await database_1.pool.query(query, [zoneId]);
        return result.rows;
    }
    static async count() {
        const query = 'SELECT COUNT(*) as count FROM warnings';
        try {
            const result = await database_1.pool.query(query);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            console.error('Error counting warnings:', error);
            throw error;
        }
    }
    static async countAll(filters = {}) {
        try {
            let whereClause = '';
            const conditions = [];
            const values = [];
            let paramIndex = 1;
            if (filters.zone_id) {
                conditions.push(`w.zone_id = $${paramIndex}`);
                values.push(filters.zone_id);
                paramIndex++;
            }
            if (filters.disaster_type_id) {
                conditions.push(`w.disaster_type_id = $${paramIndex}`);
                values.push(filters.disaster_type_id);
                paramIndex++;
            }
            if (filters.warning_level) {
                conditions.push(`w.warning_level = $${paramIndex}`);
                values.push(filters.warning_level);
                paramIndex++;
            }
            if (filters.status) {
                conditions.push(`w.status = $${paramIndex}`);
                values.push(filters.status);
                paramIndex++;
            }
            if (filters.evacuation_required !== undefined) {
                conditions.push(`w.evacuation_required = $${paramIndex}`);
                values.push(filters.evacuation_required);
                paramIndex++;
            }
            if (filters.title) {
                conditions.push(`w.title ILIKE $${paramIndex}`);
                values.push(`%${filters.title}%`);
                paramIndex++;
            }
            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }
            const query = `
        SELECT COUNT(*) as count 
        FROM warnings w 
        ${whereClause}
      `;
            const result = await database_1.pool.query(query, values);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            console.error('Error counting warnings with filters:', error);
            throw error;
        }
    }
    static async warningIdExists(warningId) {
        const query = 'SELECT id FROM warnings WHERE warning_id = $1';
        const result = await database_1.pool.query(query, [warningId]);
        return result.rows.length > 0;
    }
    static async markExpiredWarnings() {
        const query = `
      UPDATE warnings 
      SET status = 'expired' 
      WHERE status = 'active' AND expiry_time IS NOT NULL AND expiry_time <= NOW()
    `;
        const result = await database_1.pool.query(query);
        return result.rowCount || 0;
    }
    static async getWarningStats() {
        const query = `
      SELECT 
        COUNT(*) as total_warnings,
        COUNT(CASE WHEN status = 'active' AND (expiry_time IS NULL OR expiry_time > NOW()) THEN 1 END) as active_warnings,
        COUNT(CASE WHEN status = 'expired' OR (status = 'active' AND expiry_time IS NOT NULL AND expiry_time <= NOW()) THEN 1 END) as expired_warnings,
        COUNT(CASE WHEN warning_level = 1 THEN 1 END) as level_1_warnings,
        COUNT(CASE WHEN warning_level = 2 THEN 1 END) as level_2_warnings,
        COUNT(CASE WHEN warning_level = 3 THEN 1 END) as level_3_warnings,
        COUNT(CASE WHEN warning_level = 4 THEN 1 END) as level_4_warnings
      FROM warnings
    `;
        const result = await database_1.pool.query(query);
        return {
            total: parseInt(result.rows[0].total_warnings) || 0,
            active: parseInt(result.rows[0].active_warnings) || 0,
            expired: parseInt(result.rows[0].expired_warnings) || 0,
            level1: parseInt(result.rows[0].level_1_warnings) || 0,
            level2: parseInt(result.rows[0].level_2_warnings) || 0,
            level3: parseInt(result.rows[0].level_3_warnings) || 0,
            level4: parseInt(result.rows[0].level_4_warnings) || 0
        };
    }
}
exports.WarningModel = WarningModel;
//# sourceMappingURL=WarningModel.js.map