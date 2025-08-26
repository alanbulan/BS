"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const database_1 = require("../config/database");
class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }
    async executeQuery(sql, params = []) {
        try {
            const result = await database_1.pool.query(sql, params);
            return result;
        }
        catch (error) {
            console.error(`数据库查询错误 [${this.tableName}]:`, error);
            throw error;
        }
    }
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        const result = await this.executeQuery(sql, [id]);
        return result.rows[0] || null;
    }
    async findAll(limit = 100, offset = 0) {
        const sql = `SELECT * FROM ${this.tableName} ORDER BY id LIMIT $1 OFFSET $2`;
        const result = await this.executeQuery(sql, [limit, offset]);
        return result.rows;
    }
    async findWhere(conditions) {
        const keys = Object.keys(conditions);
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        const values = keys.map(key => conditions[key]);
        const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
        const result = await this.executeQuery(sql, values);
        return result.rows;
    }
    async findOneWhere(conditions) {
        const records = await this.findWhere(conditions);
        return records[0] || null;
    }
    async create(data) {
        const keys = Object.keys(data);
        const values = keys.map(key => data[key]);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
        const result = await this.executeQuery(sql, values);
        return result.rows[0];
    }
    async update(id, data) {
        const keys = Object.keys(data);
        const values = keys.map(key => data[key]);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const sql = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [id, ...values]);
        return result.rows[0] || null;
    }
    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
        const result = await this.executeQuery(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    async softDelete(id) {
        const sql = `
      UPDATE ${this.tableName} 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [id]);
        return result.rows[0] || null;
    }
    async count(conditions) {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        let params = [];
        if (conditions) {
            const keys = Object.keys(conditions);
            const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
            params = keys.map(key => conditions[key]);
            sql += ` WHERE ${whereClause}`;
        }
        const result = await this.executeQuery(sql, params);
        return parseInt(result.rows[0].count);
    }
    async exists(id) {
        const sql = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
        const result = await this.executeQuery(sql, [id]);
        return result.rows.length > 0;
    }
    async paginate(page = 1, limit = 10, conditions) {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [];
        if (conditions && Object.keys(conditions).length > 0) {
            const keys = Object.keys(conditions);
            whereClause = ' WHERE ' + keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
            params = keys.map(key => conditions[key]);
        }
        const dataSql = `SELECT * FROM ${this.tableName}${whereClause} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const dataResult = await this.executeQuery(dataSql, [...params, limit, offset]);
        const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}${whereClause}`;
        const countResult = await this.executeQuery(countSql, params);
        const total = parseInt(countResult.rows[0].count);
        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async batchInsert(dataArray) {
        if (dataArray.length === 0)
            return [];
        const keys = Object.keys(dataArray[0]);
        const values = dataArray.map((data, index) => {
            const baseIndex = index * keys.length;
            return `(${keys.map((_, keyIndex) => `$${baseIndex + keyIndex + 1}`).join(', ')})`;
        }).join(', ');
        const params = dataArray.flatMap(data => keys.map(key => data[key]));
        const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES ${values}
      RETURNING *
    `;
        const result = await this.executeQuery(sql, params);
        return result.rows;
    }
    async rawQuery(sql, params = []) {
        return this.executeQuery(sql, params);
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map