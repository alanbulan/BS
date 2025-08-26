"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAssessmentModel = void 0;
const BaseModel_1 = require("./BaseModel");
class RiskAssessmentModel extends BaseModel_1.BaseModel {
    constructor() {
        super('risk_assessments');
    }
    async create(data) {
        const fields = Object.keys(data);
        const values = fields.map(key => data[key]);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
        const sql = `
      INSERT INTO risk_assessments (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
        const result = await this.executeQuery(sql, values);
        return result.rows[0];
    }
    async updateById(id, data) {
        const fields = Object.keys(data);
        const values = fields.map(key => data[key]);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const sql = `
      UPDATE risk_assessments 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [id, ...values]);
        return result.rows[0] || null;
    }
    async getLatestByZoneId(zoneId) {
        const sql = `
      SELECT ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ra.zone_id = $1
      ORDER BY ra.assessment_time DESC
      LIMIT 1
    `;
        const result = await this.executeQuery(sql, [zoneId]);
        return result.rows[0] || null;
    }
    async getHistoryByZoneId(zoneId, days = 30, limit = 100) {
        const sql = `
      SELECT ra.*, rz.name as zone_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      WHERE ra.zone_id = $1 
        AND ra.assessment_time >= NOW() - INTERVAL '${days} days'
      ORDER BY ra.assessment_time DESC
      LIMIT $2
    `;
        const result = await this.executeQuery(sql, [zoneId, limit]);
        return result.rows;
    }
    async getHighRiskAssessments(minRiskLevel = 4) {
        const sql = `
      SELECT DISTINCT ON (ra.zone_id) ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ra.current_risk_level >= $1
      ORDER BY ra.zone_id, ra.assessment_time DESC
    `;
        const result = await this.executeQuery(sql, [minRiskLevel]);
        return result.rows;
    }
    async findByTimeRange(startTime, endTime, zoneId) {
        let sql = `
      SELECT ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ra.assessment_time BETWEEN $1 AND $2
    `;
        const params = [startTime, endTime];
        if (zoneId) {
            sql += ' AND ra.zone_id = $3';
            params.push(zoneId);
        }
        sql += ' ORDER BY ra.assessment_time DESC';
        const result = await this.executeQuery(sql, params);
        return result.rows;
    }
    async getRiskTrendStats(zoneId, days = 7) {
        const sql = `
      SELECT 
        DATE(assessment_time) as date,
        AVG(current_risk_level) as avg_risk_level,
        MAX(current_risk_level) as max_risk_level,
        MIN(current_risk_level) as min_risk_level,
        COUNT(*) as assessment_count
      FROM risk_assessments
      WHERE zone_id = $1 
        AND assessment_time >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(assessment_time)
      ORDER BY date DESC
    `;
        const result = await this.executeQuery(sql, [zoneId]);
        return result.rows;
    }
    async getCurrentRiskStatus() {
        const sql = `
      SELECT 
        rz.id as zone_id,
        rz.name as zone_name,
        rz.code as zone_code,
        dt.name as disaster_type,
        ra.current_risk_level,
        ra.predicted_risk_24h,
        ra.confidence_score,
        ra.assessment_time
      FROM risk_zones rz
      LEFT JOIN risk_assessments ra ON rz.id = ra.zone_id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ra.assessment_time = (
        SELECT MAX(assessment_time) 
        FROM risk_assessments ra2 
        WHERE ra2.zone_id = ra.zone_id
      )
      OR ra.id IS NULL
      ORDER BY ra.current_risk_level DESC NULLS LAST, rz.name
    `;
        const result = await this.executeQuery(sql);
        return result.rows;
    }
    async findByQuery(query) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (query.zone_id) {
            conditions.push(`ra.zone_id = $${paramIndex}`);
            params.push(query.zone_id);
            paramIndex++;
        }
        if (query.risk_level_min) {
            conditions.push(`ra.current_risk_level >= $${paramIndex}`);
            params.push(query.risk_level_min);
            paramIndex++;
        }
        if (query.risk_level_max) {
            conditions.push(`ra.current_risk_level <= $${paramIndex}`);
            params.push(query.risk_level_max);
            paramIndex++;
        }
        if (query.start_time) {
            conditions.push(`ra.assessment_time >= $${paramIndex}`);
            params.push(query.start_time);
            paramIndex++;
        }
        if (query.end_time) {
            conditions.push(`ra.assessment_time <= $${paramIndex}`);
            params.push(query.end_time);
            paramIndex++;
        }
        if (query.created_by) {
            conditions.push(`ra.created_by = $${paramIndex}`);
            params.push(query.created_by);
            paramIndex++;
        }
        if (query.assessment_method) {
            conditions.push(`ra.assessment_method = $${paramIndex}`);
            params.push(query.assessment_method);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `
      SELECT ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      ${whereClause}
      ORDER BY ra.assessment_time DESC
    `;
        const result = await this.executeQuery(sql, params);
        return result.rows;
    }
    async deleteOldAssessments(daysToKeep = 90) {
        const sql = `
      DELETE FROM risk_assessments 
      WHERE assessment_time < NOW() - INTERVAL '${daysToKeep} days'
    `;
        const result = await this.executeQuery(sql);
        return result.rowCount || 0;
    }
    async getAssessmentStats() {
        const sql = `
      SELECT 
        COUNT(*) as total_assessments,
        COUNT(DISTINCT zone_id) as zones_assessed,
        AVG(current_risk_level) as avg_risk_level,
        COUNT(CASE WHEN current_risk_level >= 4 THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN current_risk_level <= 2 THEN 1 END) as low_risk_count,
        MAX(assessment_time) as latest_assessment,
        MIN(assessment_time) as earliest_assessment
      FROM risk_assessments
      WHERE assessment_time >= NOW() - INTERVAL '30 days'
    `;
        const result = await this.executeQuery(sql);
        return result.rows[0];
    }
    async getAll(page = 1, limit = 10, filters) {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [];
        let paramIndex = 1;
        if (filters) {
            const conditions = [];
            if (filters.zone_id) {
                conditions.push(`ra.zone_id = $${paramIndex}`);
                params.push(filters.zone_id);
                paramIndex++;
            }
            if (filters.risk_level_min) {
                conditions.push(`ra.current_risk_level >= $${paramIndex}`);
                params.push(filters.risk_level_min);
                paramIndex++;
            }
            if (filters.risk_level_max) {
                conditions.push(`ra.current_risk_level <= $${paramIndex}`);
                params.push(filters.risk_level_max);
                paramIndex++;
            }
            if (conditions.length > 0) {
                whereClause = `WHERE ${conditions.join(' AND ')}`;
            }
        }
        const countSql = `
      SELECT COUNT(*) as total
      FROM risk_assessments ra
      ${whereClause}
    `;
        const countResult = await this.executeQuery(countSql, params);
        const total = parseInt(countResult.rows[0].total);
        params.push(limit, offset);
        const dataSql = `
      SELECT ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      ${whereClause}
      ORDER BY ra.assessment_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        const dataResult = await this.executeQuery(dataSql, params);
        return {
            assessments: dataResult.rows,
            total
        };
    }
    async getById(id) {
        const sql = `
      SELECT ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ra.id = $1
    `;
        const result = await this.executeQuery(sql, [id]);
        return result.rows[0] || null;
    }
    async update(id, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });
        if (fields.length === 0) {
            throw new Error('没有提供更新字段');
        }
        values.push(id);
        const sql = `
      UPDATE risk_assessments 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const result = await this.executeQuery(sql, values);
        return result.rows[0] || null;
    }
    async delete(id) {
        const sql = 'DELETE FROM risk_assessments WHERE id = $1';
        const result = await this.executeQuery(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    async getStats() {
        const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN current_risk_level >= 4 THEN 1 END) as high_risk,
        COUNT(CASE WHEN current_risk_level = 3 THEN 1 END) as medium_risk,
        COUNT(CASE WHEN current_risk_level <= 2 THEN 1 END) as low_risk,
        AVG(current_risk_level) as average_risk_level,
        AVG(confidence_score) as average_confidence,
        COUNT(CASE WHEN assessment_time >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_assessments
      FROM risk_assessments
    `;
        const result = await this.executeQuery(sql);
        return result.rows[0];
    }
    async getHighRiskZones(minRiskLevel = 4) {
        const sql = `
      SELECT DISTINCT ON (ra.zone_id) ra.*, rz.name as zone_name, dt.name as disaster_type_name
      FROM risk_assessments ra
      LEFT JOIN risk_zones rz ON ra.zone_id = rz.id
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ra.current_risk_level >= $1
      ORDER BY ra.zone_id, ra.assessment_time DESC
    `;
        const result = await this.executeQuery(sql, [minRiskLevel]);
        return result.rows;
    }
}
exports.RiskAssessmentModel = RiskAssessmentModel;
//# sourceMappingURL=RiskAssessmentModel.js.map