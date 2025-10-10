import { BaseModel } from './BaseModel';
import { Point, LineString, RoadNetwork as RoadNetworkType } from '../types';

// 使用统一的类型定义
export type RoadNetwork = RoadNetworkType;

export interface RoadNetworkPartial {
  id: number;
  road_id?: string;
  road_name?: string;
  geometry?: LineString;
  road_type?: string;
  road_condition?: string;
  width_meters?: number;
  speed_limit?: number;
  condition_score?: number;
  is_emergency_route: boolean;
  is_accessible?: boolean;
  maintenance_status?: string;
  last_inspection?: Date;
  traffic_capacity?: number;
  surface_type?: string;
  slope_grade?: number;
  bridge_info?: any;
  tunnel_info?: any;
  weather_restrictions?: any;
  emergency_contact?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoadNetworkData {
  road_id?: string;
  road_name?: string;
  geometry?: LineString;
  road_type?: string;
  road_condition?: string;
  width_meters?: number;
  speed_limit?: number;
  condition_score?: number;
  is_emergency_route?: boolean;
  is_accessible?: boolean;
  maintenance_status?: string;
  last_inspection?: Date;
  traffic_capacity?: number;
  surface_type?: string;
  slope_grade?: number;
  bridge_info?: any;
  tunnel_info?: any;
  weather_restrictions?: any;
  emergency_contact?: any;
}

export interface UpdateRoadNetworkData {
  road_id?: string;
  road_name?: string;
  geometry?: LineString;
  road_type?: string;
  road_condition?: string;
  width_meters?: number;
  speed_limit?: number;
  condition_score?: number;
  is_emergency_route?: boolean;
  is_accessible?: boolean;
  maintenance_status?: string;
  last_inspection?: Date;
  traffic_capacity?: number;
  surface_type?: string;
  slope_grade?: number;
  bridge_info?: any;
  tunnel_info?: any;
  weather_restrictions?: any;
  emergency_contact?: any;
}

export interface RoadNetworkQuery {
  road_type?: string;
  road_condition?: string;
  is_emergency_route?: boolean;
  is_accessible?: boolean;
  maintenance_status?: string;
  surface_type?: string;
  min_condition_score?: number;
  limit?: number;
  offset?: number;
}

export class RoadNetworkModel extends BaseModel {
  constructor() {
    super('road_network');
  }

  /**
   * 创建道路网络记录（支持冲突更新）
   */
  async create(data: CreateRoadNetworkData): Promise<RoadNetwork> {
    const query = `
      INSERT INTO road_network (
        road_id, name, geometry, road_type, road_class, width,
        surface_type, max_speed, is_bidirectional, elevation_profile,
        slope_grade, bridge_tunnel_info, maintenance_status,
        traffic_capacity, is_emergency_route
      ) VALUES (
        $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) ON CONFLICT (road_id) DO UPDATE SET
        name = EXCLUDED.name,
        geometry = EXCLUDED.geometry,
        road_type = EXCLUDED.road_type,
        road_class = EXCLUDED.road_class,
        width = EXCLUDED.width,
        surface_type = EXCLUDED.surface_type,
        max_speed = EXCLUDED.max_speed,
        is_bidirectional = EXCLUDED.is_bidirectional,
        elevation_profile = EXCLUDED.elevation_profile,
        slope_grade = EXCLUDED.slope_grade,
        bridge_tunnel_info = EXCLUDED.bridge_tunnel_info,
        maintenance_status = EXCLUDED.maintenance_status,
        traffic_capacity = EXCLUDED.traffic_capacity,
        is_emergency_route = EXCLUDED.is_emergency_route,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *,
        ST_AsGeoJSON(geometry) as geometry_json
    `;

    const values = [
      data.road_id,
      data.road_name,
      data.geometry ? JSON.stringify(data.geometry) : null,
      data.road_type,
      null, // road_class - not in new interface
      data.width_meters,
      data.surface_type,
      data.speed_limit,
      true, // is_bidirectional - not in new interface, default true
      null, // elevation_profile - not in new interface
      data.slope_grade,
      data.bridge_info ? JSON.stringify(data.bridge_info) : null,
      data.maintenance_status,
      data.traffic_capacity,
      data.is_emergency_route ?? false
    ];

    const result = await this.executeQuery(query, values);
    const row = result.rows[0];
    
    if (row.geometry_json) {
      row.geometry = JSON.parse(row.geometry_json);
      delete row.geometry_json;
    }
    
    return row as RoadNetwork;
  }

  /**
   * 根据条件查询道路网络
   */
  async findWithConditions(conditions: RoadNetworkQuery): Promise<{
    roads: RoadNetwork[];
    total: number;
  }> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (conditions.road_type) {
      whereClause += ` AND road_type = $${paramIndex}`;
      values.push(conditions.road_type);
      paramIndex++;
    }

    if (conditions.road_condition) {
      whereClause += ` AND maintenance_status = $${paramIndex}`;
      values.push(conditions.road_condition);
      paramIndex++;
    }

    if (conditions.is_emergency_route !== undefined) {
      whereClause += ` AND is_emergency_route = $${paramIndex}`;
      values.push(conditions.is_emergency_route);
      paramIndex++;
    }

    if (conditions.maintenance_status) {
      whereClause += ` AND maintenance_status = $${paramIndex}`;
      values.push(conditions.maintenance_status);
      paramIndex++;
    }

    if (conditions.surface_type) {
      whereClause += ` AND surface_type = $${paramIndex}`;
      values.push(conditions.surface_type);
      paramIndex++;
    }

    if (conditions.min_condition_score !== undefined) {
      whereClause += ` AND condition_score >= $${paramIndex}`;
      values.push(conditions.min_condition_score);
      paramIndex++;
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM road_network ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // 获取数据
    let dataQuery = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json
      FROM road_network
      ${whereClause}
      ORDER BY created_at DESC
    `;

    if (conditions.limit) {
      dataQuery += ` LIMIT $${paramIndex}`;
      values.push(conditions.limit);
      paramIndex++;
    }

    if (conditions.offset) {
      dataQuery += ` OFFSET $${paramIndex}`;
      values.push(conditions.offset);
    }

    const result = await this.executeQuery(dataQuery, values);
    const roads = result.rows.map((row: any) => {
      if (row.geometry_json) {
        row.geometry = JSON.parse(row.geometry_json);
        delete row.geometry_json;
      }
      return row;
    }) as RoadNetwork[];

    return { roads, total };
  }

  /**
   * 查找指定区域内的道路
   */
  async findInArea(bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }): Promise<RoadNetwork[]> {
    const query = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json
      FROM road_network
      WHERE ST_Intersects(
        geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      ORDER BY road_class ASC
    `;

    const values = [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat];
    const result = await this.executeQuery(query, values);
    
    return result.rows.map((row: any) => {
      if (row.geometry_json) {
        row.geometry = JSON.parse(row.geometry_json);
        delete row.geometry_json;
      }
      return row;
    }) as RoadNetwork[];
  }

  /**
   * 查找应急路线
   */
  async findEmergencyRoutes(): Promise<RoadNetwork[]> {
    const query = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json
      FROM road_network
      WHERE is_emergency_route = true
        AND maintenance_status != 'closed'
      ORDER BY id ASC
    `;

    const result = await this.executeQuery(query);
    
    return result.rows.map((row: any) => {
      if (row.geometry_json) {
        row.geometry = JSON.parse(row.geometry_json);
        delete row.geometry_json;
      }
      return row;
    }) as RoadNetwork[];
  }

  /**
   * 查找指定点附近的道路
   */
  async findNearPoint(point: { lng: number; lat: number }, radiusMeters: number): Promise<RoadNetwork[]> {
    const query = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json,
        ST_Distance(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM road_network
      WHERE ST_DWithin(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance ASC
    `;

    const result = await this.executeQuery(query, [point.lng, point.lat, radiusMeters]);
    
    return result.rows.map((row: any) => {
      if (row.geometry_json) {
        row.geometry = JSON.parse(row.geometry_json);
        delete row.geometry_json;
      }
      return row;
    }) as RoadNetwork[];
  }

   /**
   * 更新道路网络信息
   */
  async updateById(id: number, data: UpdateRoadNetworkData): Promise<RoadNetwork | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'geometry') {
          fields.push(`${key} = ST_GeomFromGeoJSON($${paramIndex})`);
          values.push(JSON.stringify(value));
        } else if (typeof value === 'object') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    const query = `
      UPDATE road_network
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *,
        ST_AsGeoJSON(geometry) as geometry_json
    `;

    values.push(id);
    const result = await this.executeQuery(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (row.geometry_json) {
      row.geometry = JSON.parse(row.geometry_json);
      delete row.geometry_json;
    }
    
    return row as RoadNetwork;
  }

  /**
   * 根据道路ID查找
   */
  async findByRoadId(roadId: string): Promise<RoadNetwork | null> {
    const query = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json
      FROM road_network
      WHERE road_id = $1
    `;

    const result = await this.executeQuery(query, [roadId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (row.geometry_json) {
      row.geometry = JSON.parse(row.geometry_json);
      delete row.geometry_json;
    }
    
    return row as RoadNetwork;
  }

  /**
   * 获取道路统计信息
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byMaintenanceStatus: Record<string, number>;
    emergencyRoutes: number;
  }> {
    const queries = [
      'SELECT COUNT(*) as total FROM road_network',
      'SELECT road_type, COUNT(*) as count FROM road_network WHERE road_type IS NOT NULL GROUP BY road_type',
      'SELECT maintenance_status, COUNT(*) as count FROM road_network WHERE maintenance_status IS NOT NULL GROUP BY maintenance_status',
      'SELECT COUNT(*) as count FROM road_network WHERE is_emergency_route = true'
    ];

    const [totalResult, typeResult, maintenanceResult, emergencyResult] = await Promise.all(
      queries.map(query => this.executeQuery(query))
    );

    const byType: Record<string, number> = {};
    typeResult.rows.forEach((row: any) => {
      byType[row.road_type] = parseInt(row.count);
    });

    const byMaintenanceStatus: Record<string, number> = {};
    maintenanceResult.rows.forEach((row: any) => {
      byMaintenanceStatus[row.maintenance_status] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].total),
      byType,
      byMaintenanceStatus,
      emergencyRoutes: parseInt(emergencyResult.rows[0].count)
    };
  }

  /**
   * 查询边界框内的道路网络
   * 用于路径规划算法
   */
  async findRoadsInBoundingBox(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
    options: { roadTypes?: string[], limit?: number } = {}
  ): Promise<RoadNetwork[]> {
    try {
      let whereClause = `
        WHERE ST_Intersects(
          geometry,
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
      `;
      
      const params: any[] = [minLon, minLat, maxLon, maxLat];
      let paramIndex = 5;

      if (options.roadTypes && options.roadTypes.length > 0) {
        const typePlaceholders = options.roadTypes.map((_, i) => `$${paramIndex + i}`).join(',');
        whereClause += ` AND road_type IN (${typePlaceholders})`;
        params.push(...options.roadTypes);
        paramIndex += options.roadTypes.length;
      }

      const limit = options.limit || 1000;
      
      const query = `
        SELECT 
          id,
          COALESCE(road_id, 'RD_' || id) as road_id,
          COALESCE(name, '未命名道路_' || id) as road_name,
          ST_AsGeoJSON(geometry)::json as geometry,
          COALESCE(road_type, '其他道路') as road_type,
          'good' as road_condition,
          width as width_meters,
          max_speed as speed_limit,
          COALESCE(is_bidirectional, true) as is_accessible,
          COALESCE(is_emergency_route, false) as is_emergency_route,
          traffic_capacity
        FROM road_network
        ${whereClause}
        ORDER BY road_class ASC, is_emergency_route DESC
        LIMIT $${paramIndex}
      `;
      
      params.push(limit);
      
      const result = await this.executeQuery(query, params);
      
      // 确保返回的数据符合RoadNetwork类型
      return result.rows.map((row: any) => ({
        id: row.id,
        road_id: row.road_id,
        road_name: row.road_name,
        geometry: row.geometry,
        road_type: row.road_type,
        road_condition: row.road_condition,
        width_meters: row.width_meters,
        speed_limit: row.speed_limit,
        is_emergency_route: row.is_emergency_route,
        is_accessible: row.is_accessible,
        traffic_capacity: row.traffic_capacity,
        created_at: new Date(),
        updated_at: new Date()
      }));
    } catch (error) {
      console.error('查询边界框内道路失败:', error);
      return [];
    }
  }

  /**
   * 查询起点和终点之间区域的道路
   */
  async findRoadsBetweenPoints(
    startPoint: Point,
    endPoint: Point,
    bufferKm: number = 2
  ): Promise<RoadNetwork[]> {
    try {
      // 计算边界框（扩展bufferKm公里）
      const [startLon, startLat] = startPoint.coordinates;
      const [endLon, endLat] = endPoint.coordinates;
      
      const bufferDegrees = bufferKm / 111.32; // 1度约111.32公里
      
      const minLon = Math.min(startLon, endLon) - bufferDegrees;
      const maxLon = Math.max(startLon, endLon) + bufferDegrees;
      const minLat = Math.min(startLat, endLat) - bufferDegrees;
      const maxLat = Math.max(startLat, endLat) + bufferDegrees;
      
      // 优先获取应急路线和主要道路
      return this.findRoadsInBoundingBox(minLon, minLat, maxLon, maxLat, {
        limit: 2000
      });
    } catch (error) {
      console.error('查询两点间道路失败:', error);
      return [];
    }
  }
}