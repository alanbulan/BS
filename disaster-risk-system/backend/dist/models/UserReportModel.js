"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserReportModel = void 0;
const BaseModel_1 = require("./BaseModel");
class UserReportModel extends BaseModel_1.BaseModel {
    constructor() {
        super('user_reports');
    }
    async create(data) {
        const sql = `
      INSERT INTO user_reports (
        user_id, location, report_type, disaster_type_id, title, description,
        severity, images, videos, verification_status, is_emergency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [
            data.user_id,
            data.location ? `POINT(${data.location.coordinates[0]} ${data.location.coordinates[1]})` : null,
            data.report_type,
            data.disaster_type_id || null,
            data.title || null,
            data.description || null,
            data.severity || 3,
            data.images ? JSON.stringify(data.images) : null,
            data.videos ? JSON.stringify(data.videos) : null,
            data.verification_status || 'pending',
            data.is_emergency || false
        ]);
        return result.rows[0];
    }
    async findWithPagination(options) {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (options.conditions) {
            const { user_id, report_type, disaster_type_id, verification_status, min_severity, max_severity, is_emergency, start_date, end_date, search } = options.conditions;
            if (user_id) {
                whereClause += ` AND user_id = $${paramIndex}`;
                params.push(user_id);
                paramIndex++;
            }
            if (report_type) {
                whereClause += ` AND report_type = $${paramIndex}`;
                params.push(report_type);
                paramIndex++;
            }
            if (disaster_type_id) {
                whereClause += ` AND disaster_type_id = $${paramIndex}`;
                params.push(disaster_type_id);
                paramIndex++;
            }
            if (verification_status) {
                whereClause += ` AND verification_status = $${paramIndex}`;
                params.push(verification_status);
                paramIndex++;
            }
            if (min_severity) {
                whereClause += ` AND severity >= $${paramIndex}`;
                params.push(min_severity);
                paramIndex++;
            }
            if (max_severity) {
                whereClause += ` AND severity <= $${paramIndex}`;
                params.push(max_severity);
                paramIndex++;
            }
            if (is_emergency !== undefined) {
                whereClause += ` AND is_emergency = $${paramIndex}`;
                params.push(is_emergency);
                paramIndex++;
            }
            if (start_date) {
                whereClause += ` AND created_at >= $${paramIndex}`;
                params.push(start_date);
                paramIndex++;
            }
            if (end_date) {
                whereClause += ` AND created_at <= $${paramIndex}`;
                params.push(end_date);
                paramIndex++;
            }
            if (search) {
                whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }
        }
        const countSql = `SELECT COUNT(*) FROM user_reports ${whereClause}`;
        const countResult = await this.executeQuery(countSql, params);
        const total = parseInt(countResult.rows[0].count);
        const dataSql = `
      SELECT * FROM user_reports 
      ${whereClause}
      ORDER BY ${options.sort.field} ${options.sort.order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        const dataResult = await this.executeQuery(dataSql, [
            ...params,
            options.pagination.limit,
            options.pagination.offset
        ]);
        return {
            data: dataResult.rows,
            pagination: {
                page: options.pagination.page,
                limit: options.pagination.limit,
                total,
                totalPages: Math.ceil(total / options.pagination.limit)
            }
        };
    }
    async findNearby(location, options = {}) {
        const { report_type, max_age_hours = 24, min_severity = 1, limit = 10 } = options;
        let whereClause = `
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        AND severity >= $4
    `;
        const params = [
            location.longitude,
            location.latitude,
            location.radius || 5000,
            min_severity
        ];
        let paramIndex = 5;
        if (report_type) {
            whereClause += ` AND report_type = $${paramIndex}`;
            params.push(report_type);
            paramIndex++;
        }
        if (max_age_hours) {
            whereClause += ` AND created_at >= NOW() - INTERVAL '${max_age_hours} hours'`;
        }
        const sql = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM user_reports
      ${whereClause}
      ORDER BY distance, severity DESC, created_at DESC
      LIMIT $${paramIndex}
    `;
        params.push(limit);
        const result = await this.executeQuery(sql, params);
        return result.rows;
    }
    async verifyReport(id, data) {
        const sql = `
      UPDATE user_reports
      SET verification_status = $1,
          verified_by = $2,
          verified_at = CURRENT_TIMESTAMP,
          verification_notes = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [
            data.verification_status,
            data.verified_by,
            data.verification_notes || null,
            id
        ]);
        return result.rows[0] || null;
    }
    async updateVotes(id, voteType) {
        const sql = `
      UPDATE user_reports
      SET ${voteType === 'upvote' ? 'upvotes = upvotes + 1' : 'downvotes = downvotes + 1'},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [id]);
        return result.rows[0] || null;
    }
    async getReportTypeStats() {
        const sql = `
      SELECT 
        report_type,
        COUNT(*) as count,
        AVG(severity) as avg_severity,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN is_emergency = true THEN 1 END) as emergency_count
      FROM user_reports
      GROUP BY report_type
      ORDER BY count DESC
    `;
        const result = await this.executeQuery(sql);
        return result.rows;
    }
    async getRecentEmergencyReports(hours = 24, limit = 10) {
        const sql = `
      SELECT * FROM user_reports
      WHERE is_emergency = true
        AND created_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at DESC
      LIMIT $1
    `;
        const result = await this.executeQuery(sql, [limit]);
        return result.rows;
    }
    async getReportTypes() {
        const sql = `
      SELECT DISTINCT report_type
      FROM user_reports
      ORDER BY report_type
    `;
        const result = await this.executeQuery(sql);
        return result.rows.map(row => row.report_type);
    }
    async getStatistics() {
        const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN is_emergency = true THEN 1 END) as emergency,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent
      FROM user_reports
    `;
        const result = await this.executeQuery(sql);
        const row = result.rows[0];
        return {
            total: parseInt(row.total),
            verified: parseInt(row.verified),
            emergency: parseInt(row.emergency),
            recent: parseInt(row.recent)
        };
    }
}
exports.UserReportModel = UserReportModel;
//# sourceMappingURL=UserReportModel.js.map