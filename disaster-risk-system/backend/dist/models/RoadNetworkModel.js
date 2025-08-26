"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadNetworkModel = void 0;
const BaseModel_1 = require("./BaseModel");
class RoadNetworkModel extends BaseModel_1.BaseModel {
    constructor() {
        super('road_network');
    }
    async create(data) {
        const query = `
      INSERT INTO road_network (
        road_id, name, geometry, road_type, road_class, width,
        surface_type, max_speed, is_bidirectional, elevation_profile,
        slope_grade, bridge_tunnel_info, maintenance_status,
        traffic_capacity, is_emergency_route
      ) VALUES (
        $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *,
        ST_AsGeoJSON(geometry) as geometry_json
    `;
        const values = [
            data.road_id,
            data.road_name,
            data.geometry ? JSON.stringify(data.geometry) : null,
            data.road_type,
            null,
            data.width_meters,
            data.surface_type,
            data.speed_limit,
            true,
            null,
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
        return row;
    }
    async findWithConditions(conditions) {
        let whereClause = 'WHERE 1=1';
        const values = [];
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
        const countQuery = `SELECT COUNT(*) FROM road_network ${whereClause}`;
        const countResult = await this.executeQuery(countQuery, values);
        const total = parseInt(countResult.rows[0].count);
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
        const roads = result.rows.map((row) => {
            if (row.geometry_json) {
                row.geometry = JSON.parse(row.geometry_json);
                delete row.geometry_json;
            }
            return row;
        });
        return { roads, total };
    }
    async findInArea(bounds) {
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
        return result.rows.map((row) => {
            if (row.geometry_json) {
                row.geometry = JSON.parse(row.geometry_json);
                delete row.geometry_json;
            }
            return row;
        });
    }
    async findEmergencyRoutes() {
        const query = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json
      FROM road_network
      WHERE is_emergency_route = true
        AND maintenance_status != 'closed'
      ORDER BY id ASC
    `;
        const result = await this.executeQuery(query);
        return result.rows.map((row) => {
            if (row.geometry_json) {
                row.geometry = JSON.parse(row.geometry_json);
                delete row.geometry_json;
            }
            return row;
        });
    }
    async findNearPoint(point, radiusMeters) {
        const query = `
      SELECT *,
        ST_AsGeoJSON(geometry) as geometry_json,
        ST_Distance(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM road_network
      WHERE ST_DWithin(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance ASC
    `;
        const result = await this.executeQuery(query, [point.lng, point.lat, radiusMeters]);
        return result.rows.map((row) => {
            if (row.geometry_json) {
                row.geometry = JSON.parse(row.geometry_json);
                delete row.geometry_json;
            }
            return row;
        });
    }
    async updateById(id, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'geometry') {
                    fields.push(`${key} = ST_GeomFromGeoJSON($${paramIndex})`);
                    values.push(JSON.stringify(value));
                }
                else if (typeof value === 'object') {
                    fields.push(`${key} = $${paramIndex}`);
                    values.push(JSON.stringify(value));
                }
                else {
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
        return row;
    }
    async findByRoadId(roadId) {
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
        return row;
    }
    async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM road_network',
            'SELECT road_type, COUNT(*) as count FROM road_network WHERE road_type IS NOT NULL GROUP BY road_type',
            'SELECT maintenance_status, COUNT(*) as count FROM road_network WHERE maintenance_status IS NOT NULL GROUP BY maintenance_status',
            'SELECT COUNT(*) as count FROM road_network WHERE is_emergency_route = true'
        ];
        const [totalResult, typeResult, maintenanceResult, emergencyResult] = await Promise.all(queries.map(query => this.executeQuery(query)));
        const byType = {};
        typeResult.rows.forEach((row) => {
            byType[row.road_type] = parseInt(row.count);
        });
        const byMaintenanceStatus = {};
        maintenanceResult.rows.forEach((row) => {
            byMaintenanceStatus[row.maintenance_status] = parseInt(row.count);
        });
        return {
            total: parseInt(totalResult.rows[0].total),
            byType,
            byMaintenanceStatus,
            emergencyRoutes: parseInt(emergencyResult.rows[0].count)
        };
    }
}
exports.RoadNetworkModel = RoadNetworkModel;
//# sourceMappingURL=RoadNetworkModel.js.map