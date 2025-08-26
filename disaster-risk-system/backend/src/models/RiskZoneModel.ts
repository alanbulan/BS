import { BaseModel } from './BaseModel';
import { RiskZone, Point, Polygon } from '../types';

export class RiskZoneModel extends BaseModel {
  constructor() {
    super('risk_zones');
  }

  // 重写分页查询方法，添加geometry字段的GeoJSON转换
  async paginate(page: number = 1, limit: number = 10, conditions?: Record<string, any>, sortBy?: string, sortOrder?: string): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (conditions) {
      // 名称搜索
      if (conditions.name) {
        whereClause += ` AND rz.name ILIKE $${paramIndex}`;
        params.push(`%${conditions.name}%`);
        paramIndex++;
      }
      
      // 灾害类型
      if (conditions.disaster_type_id) {
        whereClause += ` AND rz.disaster_type_id = $${paramIndex}`;
        params.push(conditions.disaster_type_id);
        paramIndex++;
      }
      
      // 风险等级范围
      if (conditions.risk_level_min) {
        whereClause += ` AND rz.base_risk_level >= $${paramIndex}`;
        params.push(conditions.risk_level_min);
        paramIndex++;
      }
      
      if (conditions.risk_level_max) {
        whereClause += ` AND rz.base_risk_level <= $${paramIndex}`;
        params.push(conditions.risk_level_max);
        paramIndex++;
      }
      
      // 监测状态
      if (conditions.is_monitored !== undefined) {
        whereClause += ` AND rz.is_monitored = $${paramIndex}`;
        params.push(conditions.is_monitored);
        paramIndex++;
      }
      
      // 其他精确匹配条件
      const exactMatchFields = ['code', 'administrative_level'];
      exactMatchFields.forEach(field => {
        if (conditions[field]) {
          whereClause += ` AND rz.${field} = $${paramIndex}`;
          params.push(conditions[field]);
          paramIndex++;
        }
      });
    }
    
    // 构建排序条件
    let orderClause = 'ORDER BY rz.created_at DESC';
    if (sortBy) {
      const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY rz.${sortBy} ${direction}`;
    }
    
    // 查询数据，使用ST_AsGeoJSON转换geometry字段，并JOIN disaster_types表
    const dataSql = `
      SELECT 
        rz.id, rz.name, rz.code, rz.disaster_type_id, rz.base_risk_level, 
        rz.population_density, rz.elevation_avg, rz.elevation_max, rz.elevation_min,
        rz.slope_avg, rz.slope_max, rz.geological_structure, rz.land_use_type,
        rz.vegetation_coverage, rz.administrative_level, rz.responsible_department,
        rz.emergency_contact, rz.is_monitored, rz.created_at, rz.updated_at,
        ST_AsGeoJSON(rz.geometry) as geometry_json,
        dt.name as disaster_type_name, dt.name_en as disaster_type_name_en,
        dt.description as disaster_type_description, dt.color_code as disaster_type_color
      FROM ${this.tableName} rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      ${whereClause.replace('WHERE 1=1', 'WHERE 1=1')}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const dataResult = await this.executeQuery(dataSql, params);
    
    // 处理geometry字段和disaster_type字段
    const processedData = dataResult.rows.map(row => {
      if (row.geometry_json) {
        row.geometry = JSON.parse(row.geometry_json);
        delete row.geometry_json;
      }
      
      // 构建disaster_type对象
      if (row.disaster_type_id && row.disaster_type_name) {
        row.disaster_type = {
          id: row.disaster_type_id,
          name: row.disaster_type_name,
          name_en: row.disaster_type_name_en,
          description: row.disaster_type_description,
          color_code: row.disaster_type_color
        };
        // 清理临时字段
        delete row.disaster_type_name;
        delete row.disaster_type_name_en;
        delete row.disaster_type_description;
        delete row.disaster_type_color;
      } else {
        row.disaster_type = null;
      }
      
      return row;
    });
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName} rz LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id ${whereClause}`;
    const countParams = params.slice(0, -2); // 移除limit和offset参数
    const countResult = await this.executeQuery(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: processedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // 重写findById方法以正确处理geometry字段和disaster_type
  async findById(id: number): Promise<RiskZone | null> {
    const sql = `
      SELECT 
        rz.id, rz.name, rz.code, rz.disaster_type_id, rz.base_risk_level, 
        rz.population_density, rz.elevation_avg, rz.elevation_max, rz.elevation_min,
        rz.slope_avg, rz.slope_max, rz.geological_structure, rz.land_use_type,
        rz.vegetation_coverage, rz.administrative_level, rz.responsible_department,
        rz.emergency_contact, rz.is_monitored, rz.created_at, rz.updated_at,
        ST_AsGeoJSON(rz.geometry) as geometry_json,
        dt.name as disaster_type_name, dt.name_en as disaster_type_name_en,
        dt.description as disaster_type_description, dt.color_code as disaster_type_color
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE rz.id = $1
    `;
    const result = await this.executeQuery(sql, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    // 处理geometry字段
    if (row.geometry_json) {
      row.geometry = JSON.parse(row.geometry_json);
      delete row.geometry_json;
    }
    
    // 构建disaster_type对象
    if (row.disaster_type_id && row.disaster_type_name) {
      row.disaster_type = {
        id: row.disaster_type_id,
        name: row.disaster_type_name,
        name_en: row.disaster_type_name_en,
        description: row.disaster_type_description,
        color_code: row.disaster_type_color
      };
      // 清理临时字段
      delete row.disaster_type_name;
      delete row.disaster_type_name_en;
      delete row.disaster_type_description;
      delete row.disaster_type_color;
    } else {
      row.disaster_type = null;
    }
    
    return row;
  }

  // 根据编码查找风险区域
  async findByCode(code: string): Promise<RiskZone | null> {
    const sql = `
      SELECT 
        rz.id, rz.name, rz.code, rz.disaster_type_id, rz.base_risk_level, 
        rz.population_density, rz.elevation_avg, rz.elevation_max, rz.elevation_min,
        rz.slope_avg, rz.slope_max, rz.geological_structure, rz.land_use_type,
        rz.vegetation_coverage, rz.administrative_level, rz.responsible_department,
        rz.emergency_contact, rz.is_monitored, rz.created_at, rz.updated_at,
        ST_AsGeoJSON(rz.geometry) as geometry_json,
        dt.name as disaster_type_name, dt.name_en as disaster_type_name_en,
        dt.description as disaster_type_description, dt.color_code as disaster_type_color
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE rz.code = $1
    `;
    const result = await this.executeQuery(sql, [code]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    // 处理geometry字段
    if (row.geometry_json) {
      row.geometry = JSON.parse(row.geometry_json);
      delete row.geometry_json;
    }
    
    // 构建disaster_type对象
    if (row.disaster_type_id && row.disaster_type_name) {
      row.disaster_type = {
        id: row.disaster_type_id,
        name: row.disaster_type_name,
        name_en: row.disaster_type_name_en,
        description: row.disaster_type_description,
        color_code: row.disaster_type_color
      };
      // 清理临时字段
      delete row.disaster_type_name;
      delete row.disaster_type_name_en;
      delete row.disaster_type_description;
      delete row.disaster_type_color;
    } else {
      row.disaster_type = null;
    }
    
    return row;
  }

  // 创建风险区域
  async createRiskZone(zoneData: Partial<RiskZone>): Promise<RiskZone> {
    const fields = Object.keys(zoneData).filter(key => key !== 'geometry');
    const values = fields.map(key => zoneData[key as keyof RiskZone]);
    
    let sql = `INSERT INTO risk_zones (${fields.join(', ')}`;
    let params = [...values];
    
    // 处理几何数据
    if (zoneData.geometry) {
      sql += ', geometry';
      const coordinates = zoneData.geometry.coordinates[0];
      const polygonText = `POLYGON((${coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
      sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')}, ST_GeomFromText($${params.length + 1}, 4326))`;
      params.push(polygonText);
    } else {
      sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})`;
    }
    
    sql += ' RETURNING *';
    
    const result = await this.executeQuery(sql, params);
    return result.rows[0];
  }

  // 更新风险区域
  async updateRiskZone(id: number, zoneData: Partial<RiskZone>): Promise<RiskZone | null> {
    const fields = Object.keys(zoneData).filter(key => key !== 'geometry' && key !== 'id');
    const values = fields.map(key => zoneData[key as keyof RiskZone]);
    
    let setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    let params = [id, ...values];
    
    // 处理几何数据更新
    if (zoneData.geometry) {
      const coordinates = zoneData.geometry.coordinates[0];
      const polygonText = `POLYGON((${coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
      setClause += `, geometry = ST_GeomFromText($${params.length + 1}, 4326)`;
      params.push(polygonText);
    }
    
    const sql = `
      UPDATE risk_zones 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.executeQuery(sql, params);
    return result.rows[0] || null;
  }

  // 根据位置查找风险区域
  async findByLocation(location: Point): Promise<RiskZone[]> {
    const sql = `
      SELECT rz.*, dt.name as disaster_type_name
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ST_Contains(rz.geometry, ST_GeomFromText('POINT($1 $2)', 4326))
      ORDER BY rz.base_risk_level DESC
    `;
    
    const result = await this.executeQuery(sql, [
      location.coordinates[0],
      location.coordinates[1]
    ]);
    
    return result.rows;
  }

  // 查找附近的风险区域
  async findNearbyZones(location: Point, radiusKm: number = 10): Promise<RiskZone[]> {
    const sql = `
      SELECT rz.*, dt.name as disaster_type_name,
             ST_Distance(ST_Centroid(rz.geometry), ST_GeomFromText('POINT($1 $2)', 4326)) * 111.32 as distance_km
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ST_DWithin(ST_Centroid(rz.geometry), ST_GeomFromText('POINT($1 $2)', 4326), $3 / 111.32)
      ORDER BY distance_km, rz.base_risk_level DESC
    `;
    
    const result = await this.executeQuery(sql, [
      location.coordinates[0],
      location.coordinates[1],
      radiusKm
    ]);
    
    return result.rows;
  }

  // 根据灾害类型查找风险区域
  async findByDisasterType(disasterTypeId: number): Promise<RiskZone[]> {
    const sql = `
      SELECT rz.*, dt.name as disaster_type_name
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE rz.disaster_type_id = $1
      ORDER BY rz.base_risk_level DESC, rz.name
    `;
    
    const result = await this.executeQuery(sql, [disasterTypeId]);
    return result.rows;
  }

  // 根据风险等级查找区域
  async findByRiskLevel(minLevel: number, maxLevel: number = 5): Promise<RiskZone[]> {
    const sql = `
      SELECT rz.*, dt.name as disaster_type_name
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE rz.base_risk_level BETWEEN $1 AND $2
      ORDER BY rz.base_risk_level DESC, rz.name
    `;
    
    const result = await this.executeQuery(sql, [minLevel, maxLevel]);
    return result.rows;
  }

  // 获取区域统计信息
  async getZoneStats(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_zones,
        COUNT(CASE WHEN base_risk_level = 1 THEN 1 END) as low_risk_zones,
        COUNT(CASE WHEN base_risk_level = 2 THEN 1 END) as moderate_low_risk_zones,
        COUNT(CASE WHEN base_risk_level = 3 THEN 1 END) as moderate_risk_zones,
        COUNT(CASE WHEN base_risk_level = 4 THEN 1 END) as high_risk_zones,
        COUNT(CASE WHEN base_risk_level = 5 THEN 1 END) as very_high_risk_zones,
        COUNT(CASE WHEN is_monitored = true THEN 1 END) as monitored_zones,
        AVG(population_density) as avg_population_density,
        AVG(elevation_avg) as avg_elevation
      FROM risk_zones
    `;
    
    const result = await this.executeQuery(sql);
    return result.rows[0];
  }

  // 检查区域编码是否存在
  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM risk_zones WHERE code = $1';
    const params = [code];
    
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId.toString());
    }
    
    const result = await this.executeQuery(sql, params);
    return result.rows.length > 0;
  }

  // 获取区域边界框
  async getZoneBounds(id: number): Promise<any> {
    const sql = `
      SELECT 
        ST_XMin(geometry) as min_lng,
        ST_YMin(geometry) as min_lat,
        ST_XMax(geometry) as max_lng,
        ST_YMax(geometry) as max_lat,
        ST_X(ST_Centroid(geometry)) as center_lng,
        ST_Y(ST_Centroid(geometry)) as center_lat
      FROM risk_zones 
      WHERE id = $1
    `;
    
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0] || null;
  }

  // 查找重叠的风险区域
  async findOverlappingZones(geometry: Polygon): Promise<RiskZone[]> {
    const coordinates = geometry.coordinates[0];
    const polygonText = `POLYGON((${coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
    
    const sql = `
      SELECT rz.*, dt.name as disaster_type_name
      FROM risk_zones rz
      LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id
      WHERE ST_Overlaps(rz.geometry, ST_GeomFromText($1, 4326))
         OR ST_Contains(rz.geometry, ST_GeomFromText($1, 4326))
         OR ST_Contains(ST_GeomFromText($1, 4326), rz.geometry)
      ORDER BY rz.base_risk_level DESC
    `;
    
    const result = await this.executeQuery(sql, [polygonText]);
    return result.rows;
  }

  // 获取风险区域统计信息
  async getStatistics(): Promise<{
    total: number;
    highRisk: number;
    byDisasterType: Record<string, number>;
    byRiskLevel: Record<string, number>;
  }> {
    const queries = [
      'SELECT COUNT(*) as total FROM risk_zones',
      'SELECT COUNT(*) as count FROM risk_zones WHERE base_risk_level >= 4',
      `SELECT dt.name, COUNT(*) as count 
       FROM risk_zones rz 
       LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id 
       WHERE dt.name IS NOT NULL 
       GROUP BY dt.name`,
      'SELECT base_risk_level, COUNT(*) as count FROM risk_zones GROUP BY base_risk_level'
    ];

    const [totalResult, highRiskResult, disasterTypeResult, riskLevelResult] = await Promise.all(
      queries.map(query => this.executeQuery(query))
    );

    const byDisasterType: Record<string, number> = {};
    disasterTypeResult.rows.forEach((row: any) => {
      byDisasterType[row.name] = parseInt(row.count);
    });

    const byRiskLevel: Record<string, number> = {};
    riskLevelResult.rows.forEach((row: any) => {
      byRiskLevel[`level${row.base_risk_level}`] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].total),
      highRisk: parseInt(highRiskResult.rows[0].count),
      byDisasterType,
      byRiskLevel
    };
  }

  // 获取风险等级分布
  async getRiskLevelDistribution(): Promise<Record<string, number>> {
    const sql = 'SELECT base_risk_level, COUNT(*) as count FROM risk_zones GROUP BY base_risk_level ORDER BY base_risk_level';
    const result = await this.executeQuery(sql);
    
    const distribution: Record<string, number> = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0
    };
    
    result.rows.forEach((row: any) => {
      distribution[`level${row.base_risk_level}`] = parseInt(row.count);
    });
    
    return distribution;
  }

  // 静态方法
  static async findById(id: number): Promise<RiskZone | null> {
    const model = new RiskZoneModel();
    return await model.findById(id);
  }

  static async findByCode(code: string): Promise<RiskZone | null> {
    const model = new RiskZoneModel();
    const result = await model.findWhere({ code });
    return result[0] || null;
  }

  static async findByLocation(location: Point): Promise<RiskZone[]> {
    const model = new RiskZoneModel();
    return await model.findByLocation(location);
  }

  static async update(id: number, data: Record<string, any>): Promise<RiskZone | null> {
    const model = new RiskZoneModel();
    return await model.update(id, data);
  }

  static async delete(id: number): Promise<boolean> {
    const model = new RiskZoneModel();
    return await model.delete(id);
  }

  static async getStatistics(): Promise<{
    total: number;
    highRisk: number;
    byDisasterType: Record<string, number>;
    byRiskLevel: Record<string, number>;
  }> {
    const model = new RiskZoneModel();
    return await model.getStatistics();
  }

  static async createZone(zoneData: any): Promise<RiskZone> {
    const model = new RiskZoneModel();
    return await model.createRiskZone(zoneData);
  }

  static async paginate(page: number, limit: number, filters?: any, sortBy?: string, sortOrder?: string): Promise<{ data: RiskZone[]; pagination: any }> {
    const model = new RiskZoneModel();
    return await model.paginate(page, limit, filters);
  }
}