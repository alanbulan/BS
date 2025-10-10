import { BaseModel } from './BaseModel';
import { User, CreateUserData, UpdateUserData, Point } from '../types';
import * as bcrypt from 'bcryptjs';

export class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  // 重写分页查询方法，包含location字段的文本格式
  async paginate(page: number = 1, limit: number = 10, conditions?: Record<string, any>): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = '';
    let params: any[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      whereClause = ' WHERE ' + keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      params = keys.map(key => conditions[key]);
    }
    
    // 查询数据，包含location的文本格式和经纬度
    const dataSql = `
      SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, 
             CASE 
               WHEN location IS NOT NULL THEN ST_AsText(location)
               ELSE NULL 
             END as location,
             ST_X(location) as longitude,
             ST_Y(location) as latitude
      FROM ${this.tableName}${whereClause} 
      ORDER BY id DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataResult = await this.executeQuery(dataSql, [...params, limit, offset]);
    

    
    // 查询总数
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

  // 重写findById方法，包含location字段的文本格式和经纬度
  async findById(id: number): Promise<any> {
    const sql = `SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, password_hash, avatar_url, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0] || null;
  }

  // 创建用户
  async createUser(userData: CreateUserData): Promise<User> {
    // 密码加密
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    const fields = ['username', 'email', 'password_hash'];
    const values = [userData.username, userData.email, password_hash];

    // 处理可选字段
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

    // 处理位置数据
    if (userData.location) {
      sql += ', location';
      const pointText = `POINT(${userData.location.coordinates[0]} ${userData.location.coordinates[1]})`;
      sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')}, ST_GeomFromText($${params.length + 1}, 4326))`;
      params.push(pointText);
    } else {
      sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})`;
    }

    sql += ' RETURNING *';

    const result = await this.executeQuery(sql, params);
    return result.rows[0];
  }

  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    const sql = 'SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, password_hash, avatar_url, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude FROM users WHERE username = $1';
    const result = await this.executeQuery(sql, [username]);
    return result.rows[0] || null;
  }

  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, password_hash, avatar_url, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude FROM users WHERE email = $1';
    const result = await this.executeQuery(sql, [email]);
    return result.rows[0] || null;
  }

  // 验证用户密码
  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password_hash);
  }

  // 更新用户信息
  async updateUser(id: number, userData: UpdateUserData): Promise<User | null> {
    const fields = Object.keys(userData).filter(key => key !== 'location');
    const values = fields.map(key => userData[key as keyof UpdateUserData]);

    let setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    let params = [id, ...values];

    // 处理位置数据更新
    if (userData.location) {
      let pointText: string;
      
      // 支持多种location格式
      if (typeof userData.location === 'string') {
        // 字符串格式：直接使用
        pointText = userData.location;
      } else if (userData.location.coordinates && Array.isArray(userData.location.coordinates)) {
        // GeoJSON格式
        pointText = `POINT(${userData.location.coordinates[0]} ${userData.location.coordinates[1]})`;
      } else {
        console.warn('无效的location格式:', userData.location);
        pointText = null as any;
      }
      
      if (pointText) {
        setClause += `, location = ST_GeomFromText($${params.length + 1}, 4326)`;
        params.push(pointText);
      }
    }

    const sql = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, avatar_url, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude
    `;

    const result = await this.executeQuery(sql, params);
    return result.rows[0] || null;
  }

  // 更新用户密码
  async updatePassword(id: number, newPassword: string): Promise<boolean> {
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

  // 更新用户位置
  async updateLocation(id: number, location: Point): Promise<User | null> {
    const pointText = `POINT(${location.coordinates[0]} ${location.coordinates[1]})`;
    
    const sql = `
      UPDATE users 
      SET location = ST_GeomFromText($2, 4326), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude
    `;

    const result = await this.executeQuery(sql, [id, pointText]);
    return result.rows[0] || null;
  }

  // 获取用户位置
  async getUserLocation(id: number): Promise<Point | null> {
    const sql = `
      SELECT ST_X(location) as longitude, ST_Y(location) as latitude
      FROM users 
      WHERE id = $1 AND location IS NOT NULL
    `;

    const result = await this.executeQuery(sql, [id]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      type: 'Point',
      coordinates: [row.longitude, row.latitude]
    };
  }

  // 查找附近的用户
  async findNearbyUsers(location: Point, radiusKm: number = 10): Promise<User[]> {
    const sql = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.department, u.position, u.role, u.permissions, u.is_active, u.last_login, u.created_at, u.updated_at, ST_AsText(u.location) as location,
             ST_X(u.location) as longitude, ST_Y(u.location) as latitude,
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

  // 激活/停用用户
  async toggleUserStatus(id: number, isActive: boolean): Promise<User | null> {
    const sql = `
      UPDATE users 
      SET is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude
    `;

    const result = await this.executeQuery(sql, [id, isActive]);
    return result.rows[0] || null;
  }

  // 检查用户名是否存在
  async usernameExists(username: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM users WHERE username = $1';
    const params = [username];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId.toString());
    }

    const result = await this.executeQuery(sql, params);
    return result.rows.length > 0;
  }

  // 检查邮箱是否存在
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM users WHERE email = $1';
    const params = [email];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId.toString());
    }

    const result = await this.executeQuery(sql, params);
    return result.rows.length > 0;
  }

  // 根据角色查找用户
  async findByRole(role: string): Promise<User[]> {
    const sql = 'SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude FROM users WHERE role = $1 AND is_active = true ORDER BY created_at DESC';
    const result = await this.executeQuery(sql, [role]);
    return result.rows;
  }

  // 获取用户统计信息
  async getUserStats(): Promise<any> {
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

  // 搜索用户
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const sql = `
      SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude FROM users 
      WHERE (username ILIKE $1 OR email ILIKE $1) 
        AND is_active = true
      ORDER BY username
      LIMIT $2
    `;

    const result = await this.executeQuery(sql, [`%${query}%`, limit]);
    return result.rows;
  }

  // 获取最近注册的用户
  async getRecentUsers(limit: number = 10): Promise<User[]> {
    const sql = `
      SELECT id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await this.executeQuery(sql, [limit]);
    return result.rows;
  }

  // 删除用户（软删除）
  async deleteUser(id: number): Promise<boolean> {
    const sql = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const result = await this.executeQuery(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  // 更新最后登录时间
  async updateLastLogin(id: number): Promise<boolean> {
    const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const result = await this.executeQuery(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  // 永久删除用户（谨慎使用）
  async permanentDeleteUser(id: number): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE id = $1';
    const result = await this.executeQuery(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  // 批量更新用户状态
  async batchUpdateStatus(userIds: number[], isActive: boolean): Promise<User[]> {
    if (userIds.length === 0) return [];

    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `
      UPDATE users 
      SET is_active = $${userIds.length + 1}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
      RETURNING id, username, email, full_name, phone, department, position, role, permissions, is_active, last_login, created_at, updated_at, ST_AsText(location) as location, ST_X(location) as longitude, ST_Y(location) as latitude
    `;

    const result = await this.executeQuery(sql, [...userIds, isActive]);
    return result.rows;
  }
}