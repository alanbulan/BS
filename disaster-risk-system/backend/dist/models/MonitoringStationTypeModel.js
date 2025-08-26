"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringStationTypeModel = void 0;
const BaseModel_1 = require("./BaseModel");
class MonitoringStationTypeModel extends BaseModel_1.BaseModel {
    constructor() {
        super('monitoring_station_types');
    }
    async getActiveTypes() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY sort_order ASC, id ASC`;
        const result = await this.executeQuery(sql, []);
        return result.rows;
    }
    async findByCode(code) {
        const rows = await this.findWhere({ code });
        return rows[0] ?? null;
    }
    async codeExists(code, excludeId) {
        if (excludeId) {
            const sql = `SELECT 1 FROM ${this.tableName} WHERE code = $1 AND id <> $2 LIMIT 1`;
            const result = await this.executeQuery(sql, [code, excludeId]);
            return result.rows.length > 0;
        }
        const rows = await this.findWhere({ code });
        return rows.length > 0;
    }
    async create(data) {
        const payload = {
            code: data.code,
            name_zh: data.name_zh,
            name_en: data.name_en,
            description_zh: data.description_zh ?? null,
            description_en: data.description_en ?? null,
            is_active: data.is_active ?? true,
            sort_order: data.sort_order ?? 0,
        };
        const created = await super.create(payload);
        return created;
    }
    async update(id, data) {
        const cleaned = {};
        Object.entries(data).forEach(([k, v]) => {
            if (v !== undefined)
                cleaned[k] = v;
        });
        const updated = await super.update(id, cleaned);
        return updated ?? null;
    }
    async delete(id) {
        return super.delete(id);
    }
    async validateStationType(code) {
        const type = await this.findByCode(code);
        return !!type && !!type.is_active;
    }
    async getTypeUsageStats() {
        const sql = `
      SELECT t.code, t.name_zh, t.name_en, COUNT(s.id) AS station_count
      FROM ${this.tableName} t
      LEFT JOIN monitoring_stations s ON s.station_type = t.code
      GROUP BY t.code, t.name_zh, t.name_en
      ORDER BY t.sort_order ASC, t.code ASC
    `;
        const result = await this.executeQuery(sql, []);
        return result.rows;
    }
}
exports.MonitoringStationTypeModel = MonitoringStationTypeModel;
//# sourceMappingURL=MonitoringStationTypeModel.js.map