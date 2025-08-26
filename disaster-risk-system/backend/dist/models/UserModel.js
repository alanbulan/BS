"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const BaseModel_1 = require("./BaseModel");
const bcrypt = __importStar(require("bcryptjs"));
class UserModel extends BaseModel_1.BaseModel {
    constructor() {
        super('users');
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
        const dataSql = `
      SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, 
             CASE 
               WHEN location IS NOT NULL THEN ST_AsText(location)
               ELSE NULL 
             END as location
      FROM ${this.tableName}${whereClause} 
      ORDER BY id DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
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
    async findById(id) {
        const sql = `SELECT id, username, email, phone, role, is_active, created_at, updated_at, ST_AsText(location) as location FROM ${this.tableName} WHERE id = $1`;
        const result = await this.executeQuery(sql, [id]);
        return result.rows[0] || null;
    }
    async createUser(userData) {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(userData.password, saltRounds);
        const fields = ['username', 'email', 'password_hash'];
        const values = [userData.username, userData.email, password_hash];
        if (userData.phone) {
            fields.push('phone');
            values.push(userData.phone);
        }
        if (userData.full_name) {
            fields.push('full_name');
            values.push(userData.full_name);
        }
        if (userData.department) {
            fields.push('department');
            values.push(userData.department);
        }
        if (userData.position) {
            fields.push('position');
            values.push(userData.position);
        }
        if (userData.avatar_url) {
            fields.push('avatar_url');
            values.push(userData.avatar_url);
        }
        if (userData.role) {
            fields.push('role');
            values.push(userData.role);
        }
        if (userData.permissions) {
            fields.push('permissions');
            values.push(JSON.stringify(userData.permissions));
        }
        let sql = `INSERT INTO users (${fields.join(', ')}`;
        let params = [...values];
        if (userData.location) {
            sql += ', location';
            const pointText = `POINT(${userData.location.coordinates[0]} ${userData.location.coordinates[1]})`;
            sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')}, ST_GeomFromText($${params.length + 1}, 4326))`;
            params.push(pointText);
        }
        else {
            sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})`;
        }
        sql += ' RETURNING *';
        const result = await this.executeQuery(sql, params);
        return result.rows[0];
    }
    async findByUsername(username) {
        const sql = 'SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, password_hash, ST_AsText(location) as location FROM users WHERE username = $1';
        const result = await this.executeQuery(sql, [username]);
        return result.rows[0] || null;
    }
    async findByEmail(email) {
        const sql = 'SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, password_hash, ST_AsText(location) as location FROM users WHERE email = $1';
        const result = await this.executeQuery(sql, [email]);
        return result.rows[0] || null;
    }
    async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }
    async updateUser(id, userData) {
        const fields = Object.keys(userData).filter(key => key !== 'location');
        const values = fields.map(key => userData[key]);
        let setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        let params = [id, ...values];
        if (userData.location) {
            const pointText = `POINT(${userData.location.coordinates[0]} ${userData.location.coordinates[1]})`;
            setClause += `, location = ST_GeomFromText($${params.length + 1}, 4326)`;
            params.push(pointText);
        }
        const sql = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location
    `;
        const result = await this.executeQuery(sql, params);
        return result.rows[0] || null;
    }
    async updatePassword(id, newPassword) {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);
        const sql = `
      UPDATE users 
      SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        const result = await this.executeQuery(sql, [id, password_hash]);
        return (result.rowCount || 0) > 0;
    }
    async updateLocation(id, location) {
        const pointText = `POINT(${location.coordinates[0]} ${location.coordinates[1]})`;
        const sql = `
      UPDATE users 
      SET location = ST_GeomFromText($2, 4326), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location
    `;
        const result = await this.executeQuery(sql, [id, pointText]);
        return result.rows[0] || null;
    }
    async getUserLocation(id) {
        const sql = `
      SELECT ST_X(location) as longitude, ST_Y(location) as latitude
      FROM users 
      WHERE id = $1 AND location IS NOT NULL
    `;
        const result = await this.executeQuery(sql, [id]);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            type: 'Point',
            coordinates: [row.longitude, row.latitude]
        };
    }
    async findNearbyUsers(location, radiusKm = 10) {
        const sql = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.department, u.position, u.role, u.permissions, u.is_active, u.last_login, u.created_at, u.updated_at, ST_AsText(u.location) as location,
             ST_Distance(u.location, ST_GeomFromText('POINT($1 $2)', 4326)) * 111.32 as distance_km
      FROM users u
      WHERE u.location IS NOT NULL 
        AND u.is_active = true
        AND ST_DWithin(u.location, ST_GeomFromText('POINT($1 $2)', 4326), $3 / 111.32)
      ORDER BY distance_km
    `;
        const result = await this.executeQuery(sql, [
            location.coordinates[0],
            location.coordinates[1],
            radiusKm.toString()
        ]);
        return result.rows;
    }
    async toggleUserStatus(id, isActive) {
        const sql = `
      UPDATE users 
      SET is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location
    `;
        const result = await this.executeQuery(sql, [id, isActive]);
        return result.rows[0] || null;
    }
    async usernameExists(username, excludeId) {
        let sql = 'SELECT 1 FROM users WHERE username = $1';
        const params = [username];
        if (excludeId) {
            sql += ' AND id != $2';
            params.push(excludeId.toString());
        }
        const result = await this.executeQuery(sql, params);
        return result.rows.length > 0;
    }
    async emailExists(email, excludeId) {
        let sql = 'SELECT 1 FROM users WHERE email = $1';
        const params = [email];
        if (excludeId) {
            sql += ' AND id != $2';
            params.push(excludeId.toString());
        }
        const result = await this.executeQuery(sql, params);
        return result.rows.length > 0;
    }
    async findByRole(role) {
        const sql = 'SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location FROM users WHERE role = $1 AND is_active = true ORDER BY created_at DESC';
        const result = await this.executeQuery(sql, [role]);
        return result.rows;
    }
    async getUserStats() {
        const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'expert' THEN 1 END) as expert_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as users_with_location,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `;
        const result = await this.executeQuery(sql);
        return result.rows[0];
    }
    async searchUsers(query, limit = 20) {
        const sql = `
      SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location FROM users 
      WHERE (username ILIKE $1 OR email ILIKE $1) 
        AND is_active = true
      ORDER BY username
      LIMIT $2
    `;
        const result = await this.executeQuery(sql, [`%${query}%`, limit]);
        return result.rows;
    }
    async getRecentUsers(limit = 10) {
        const sql = `
      SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1
    `;
        const result = await this.executeQuery(sql, [limit]);
        return result.rows;
    }
    async deleteUser(id) {
        const sql = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        const result = await this.executeQuery(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    async updateLastLogin(id) {
        const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        const result = await this.executeQuery(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    async permanentDeleteUser(id) {
        const sql = 'DELETE FROM users WHERE id = $1';
        const result = await this.executeQuery(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    async batchUpdateStatus(userIds, isActive) {
        if (userIds.length === 0)
            return [];
        const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
        const sql = `
      UPDATE users 
      SET is_active = $${userIds.length + 1}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location
    `;
        const result = await this.executeQuery(sql, [...userIds, isActive]);
        return result.rows;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=UserModel.js.map