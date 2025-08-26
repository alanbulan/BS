"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscapeRouteModel = void 0;
const BaseModel_1 = require("./BaseModel");
class EscapeRouteModel extends BaseModel_1.BaseModel {
    constructor() {
        super('escape_routes');
    }
    async findById(id) {
        const query = `
      SELECT *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
      FROM escape_routes
      WHERE id = $1
    `;
        const result = await this.executeQuery(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        this.parseGeometryFields(row);
        return row;
    }
    async create(data) {
        const query = `
      INSERT INTO escape_routes (
        route_id, start_point, end_point, route_geometry,
        distance_meters, estimated_time_minutes, difficulty_level,
        elevation_gain, route_conditions, waypoints, alternative_routes,
        safety_score, weather_dependency, accessibility_info,
        last_verified_date, verification_status
      ) VALUES (
        $1, ST_GeomFromGeoJSON($2), ST_GeomFromGeoJSON($3), ST_GeomFromGeoJSON($4),
        $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
    `;
        const values = [
            data.route_id,
            data.start_point ? JSON.stringify(data.start_point) : null,
            data.end_point ? JSON.stringify(data.end_point) : null,
            data.route_geometry ? JSON.stringify(data.route_geometry) : null,
            data.distance_meters,
            data.estimated_time_minutes,
            data.difficulty_level,
            data.elevation_gain,
            data.route_conditions ? JSON.stringify(data.route_conditions) : null,
            data.waypoints ? JSON.stringify(data.waypoints) : null,
            data.alternative_routes ? JSON.stringify(data.alternative_routes) : null,
            data.safety_score,
            data.weather_dependency ? JSON.stringify(data.weather_dependency) : null,
            data.accessibility_info ? JSON.stringify(data.accessibility_info) : null,
            data.last_verified_date,
            data.verification_status || 'pending'
        ];
        const result = await this.executeQuery(query, values);
        const row = result.rows[0];
        this.parseGeometryFields(row);
        return row;
    }
    async findWithConditions(conditions) {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramIndex = 1;
        if (conditions.difficulty_level !== undefined) {
            whereClause += ` AND difficulty_level = $${paramIndex}`;
            values.push(conditions.difficulty_level);
            paramIndex++;
        }
        if (conditions.verification_status) {
            whereClause += ` AND verification_status = $${paramIndex}`;
            values.push(conditions.verification_status);
            paramIndex++;
        }
        if (conditions.min_safety_score !== undefined) {
            whereClause += ` AND safety_score >= $${paramIndex}`;
            values.push(conditions.min_safety_score);
            paramIndex++;
        }
        if (conditions.max_distance !== undefined) {
            whereClause += ` AND distance_meters <= $${paramIndex}`;
            values.push(conditions.max_distance);
            paramIndex++;
        }
        if (conditions.route_id && conditions.route_id.trim() !== '') {
            whereClause += ` AND route_id ILIKE $${paramIndex}`;
            values.push(`%${conditions.route_id.trim()}%`);
            paramIndex++;
        }
        const countQuery = `SELECT COUNT(*) FROM escape_routes ${whereClause}`;
        const countResult = await this.executeQuery(countQuery, values);
        const total = parseInt(countResult.rows[0].count);
        let dataQuery = `
      SELECT *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
      FROM escape_routes
      ${whereClause}
      ORDER BY safety_score DESC, created_at DESC
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
        const routes = result.rows.map((row) => {
            this.parseGeometryFields(row);
            return row;
        });
        return { routes, total };
    }
    async findFromPoint(point, maxDistance = 5000) {
        const query = `
      SELECT *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json,
        ST_Distance(
          ST_GeomFromGeoJSON($1),
          start_point
        ) as distance_to_start
      FROM escape_routes
      WHERE ST_DWithin(
        ST_GeomFromGeoJSON($1),
        start_point,
        $2
      )
        AND verification_status = 'verified'
      ORDER BY distance_to_start ASC, safety_score DESC
      LIMIT 10
    `;
        const values = [JSON.stringify(point), maxDistance];
        const result = await this.executeQuery(query, values);
        return result.rows.map((row) => {
            this.parseGeometryFields(row);
            return row;
        });
    }
    async findToShelter(shelterPoint, maxDistance = 10000) {
        const query = `
      SELECT *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json,
        ST_Distance(
          ST_GeomFromGeoJSON($1),
          end_point
        ) as distance_to_end
      FROM escape_routes
      WHERE ST_DWithin(
        ST_GeomFromGeoJSON($1),
        end_point,
        $2
      )
        AND verification_status = 'verified'
      ORDER BY distance_to_end ASC, safety_score DESC
      LIMIT 10
    `;
        const values = [JSON.stringify(shelterPoint), maxDistance];
        const result = await this.executeQuery(query, values);
        return result.rows.map((row) => {
            this.parseGeometryFields(row);
            return row;
        });
    }
    async findInArea(bounds) {
        const query = `
      SELECT *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
      FROM escape_routes
      WHERE ST_Intersects(
        route_geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
        AND verification_status = 'verified'
      ORDER BY safety_score DESC
    `;
        const values = [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat];
        const result = await this.executeQuery(query, values);
        return result.rows.map((row) => {
            this.parseGeometryFields(row);
            return row;
        });
    }
    async updateById(id, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (['start_point', 'end_point', 'route_geometry'].includes(key)) {
                    fields.push(`${key} = ST_GeomFromGeoJSON($${paramIndex})`);
                    values.push(JSON.stringify(value));
                }
                else if (typeof value === 'object' && value !== null) {
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
      UPDATE escape_routes
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
    `;
        values.push(id);
        const result = await this.executeQuery(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        this.parseGeometryFields(row);
        return row;
    }
    async findByRouteId(routeId) {
        const query = `
      SELECT *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
      FROM escape_routes
      WHERE route_id = $1
    `;
        const result = await this.executeQuery(query, [routeId]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        this.parseGeometryFields(row);
        return row;
    }
    async verifyRoute(id, status, notes) {
        const query = `
      UPDATE escape_routes
      SET verification_status = $1,
          last_verified_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *,
        ST_AsGeoJSON(start_point) as start_point_json,
        ST_AsGeoJSON(end_point) as end_point_json,
        ST_AsGeoJSON(route_geometry) as route_geometry_json
    `;
        const result = await this.executeQuery(query, [status, id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        this.parseGeometryFields(row);
        return row;
    }
    async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM escape_routes',
            'SELECT difficulty_level, COUNT(*) as count FROM escape_routes WHERE difficulty_level IS NOT NULL GROUP BY difficulty_level',
            'SELECT verification_status, COUNT(*) as count FROM escape_routes GROUP BY verification_status',
            'SELECT AVG(safety_score) as avg_score FROM escape_routes WHERE safety_score IS NOT NULL',
            'SELECT AVG(distance_meters) as avg_distance FROM escape_routes WHERE distance_meters IS NOT NULL'
        ];
        const [totalResult, difficultyResult, statusResult, scoreResult, distanceResult] = await Promise.all(queries.map(query => this.executeQuery(query)));
        const byDifficulty = {};
        difficultyResult.rows.forEach((row) => {
            byDifficulty[row.difficulty_level] = parseInt(row.count);
        });
        const byStatus = {};
        statusResult.rows.forEach((row) => {
            byStatus[row.verification_status] = parseInt(row.count);
        });
        return {
            total: parseInt(totalResult.rows[0].total),
            byDifficulty,
            byStatus,
            averageSafetyScore: parseFloat(scoreResult.rows[0].avg_score) || 0,
            averageDistance: parseFloat(distanceResult.rows[0].avg_distance) || 0
        };
    }
    parseGeometryFields(row) {
        if (row.start_point_json) {
            row.start_point = JSON.parse(row.start_point_json);
            delete row.start_point_json;
        }
        if (row.end_point_json) {
            row.end_point = JSON.parse(row.end_point_json);
            delete row.end_point_json;
        }
        if (row.route_geometry_json) {
            row.route_geometry = JSON.parse(row.route_geometry_json);
            delete row.route_geometry_json;
        }
    }
}
exports.EscapeRouteModel = EscapeRouteModel;
//# sourceMappingURL=EscapeRouteModel.js.map