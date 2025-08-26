"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisasterTypeModel = void 0;
const BaseModel_1 = require("./BaseModel");
class DisasterTypeModel extends BaseModel_1.BaseModel {
    constructor() {
        super('disaster_types');
    }
    async createDisasterType(data) {
        const fields = Object.keys(data);
        const values = fields.map(key => data[key]);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
        const sql = `
      INSERT INTO disaster_types (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
        const result = await this.executeQuery(sql, values);
        return result.rows[0];
    }
    async findByName(name) {
        const sql = 'SELECT * FROM disaster_types WHERE name = $1';
        const result = await this.executeQuery(sql, [name]);
        return result.rows[0] || null;
    }
    async getActiveTypes() {
        const sql = `
      SELECT * FROM disaster_types 
      WHERE is_active = true 
      ORDER BY base_risk_level DESC, name
    `;
        const result = await this.executeQuery(sql);
        return result.rows;
    }
    async getByRiskLevel(riskLevel) {
        const sql = `
      SELECT * FROM disaster_types 
      WHERE base_risk_level = $1 AND is_active = true
      ORDER BY name
    `;
        const result = await this.executeQuery(sql, [riskLevel]);
        return result.rows;
    }
    async updateDisasterType(id, data) {
        const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
        const values = fields.map(key => data[key]);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const sql = `
      UPDATE disaster_types 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [id, ...values]);
        return result.rows[0] || null;
    }
    async toggleActive(id, isActive) {
        const sql = `
      UPDATE disaster_types 
      SET is_active = $2
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [id, isActive]);
        return result.rows[0] || null;
    }
    async nameExists(name, excludeId) {
        let sql = 'SELECT 1 FROM disaster_types WHERE name = $1';
        const params = [name];
        if (excludeId) {
            sql += ' AND id != $2';
            params.push(excludeId.toString());
        }
        const result = await this.executeQuery(sql, params);
        return result.rows.length > 0;
    }
    async getTypeStats() {
        const sql = `
      SELECT 
        COUNT(*) as total_types,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_types,
        COUNT(CASE WHEN base_risk_level >= 4 THEN 1 END) as high_risk_types,
        AVG(base_risk_level) as avg_risk_level
      FROM disaster_types
    `;
        const result = await this.executeQuery(sql);
        return result.rows[0];
    }
    async checkReferences(disasterTypeId) {
        const checks = [
            { table: 'risk_zones', sql: 'SELECT COUNT(*) as count FROM risk_zones WHERE disaster_type_id = $1' },
            { table: 'user_reports', sql: 'SELECT COUNT(*) as count FROM user_reports WHERE disaster_type_id = $1' }
        ];
        const referencedTables = [];
        for (const check of checks) {
            const result = await this.executeQuery(check.sql, [disasterTypeId]);
            if (parseInt(result.rows[0].count) > 0) {
                referencedTables.push(check.table);
            }
        }
        return {
            hasReferences: referencedTables.length > 0,
            referencedTables
        };
    }
    async checkRiskZoneReferences(disasterTypeId) {
        const sql = 'SELECT COUNT(*) as count FROM risk_zones WHERE disaster_type_id = $1';
        const result = await this.executeQuery(sql, [disasterTypeId]);
        return parseInt(result.rows[0].count) > 0;
    }
}
exports.DisasterTypeModel = DisasterTypeModel;
//# sourceMappingURL=DisasterTypeModel.js.map