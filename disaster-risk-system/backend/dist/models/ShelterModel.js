"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShelterModel = void 0;
const BaseModel_1 = require("./BaseModel");
class ShelterModel extends BaseModel_1.BaseModel {
    constructor() {
        super('shelters');
    }
    async create(data) {
        const sql = `
      INSERT INTO shelters (
        name, location, address, capacity, current_occupancy, shelter_type,
        facilities, contact_info, access_routes, elevation, safety_level,
        operating_hours, special_requirements, is_active, last_inspection_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [
            data.name,
            data.location ? `POINT(${data.location.coordinates[0]} ${data.location.coordinates[1]})` : null,
            data.address || null,
            data.capacity,
            data.current_occupancy || 0,
            data.shelter_type || null,
            data.facilities ? JSON.stringify(data.facilities) : null,
            data.contact_info ? JSON.stringify(data.contact_info) : null,
            data.access_routes ? JSON.stringify(data.access_routes) : null,
            data.elevation || null,
            data.safety_level || null,
            data.operating_hours ? JSON.stringify(data.operating_hours) : null,
            data.special_requirements || null,
            data.is_active !== undefined ? data.is_active : true,
            data.last_inspection_date || null
        ]);
        return result.rows[0];
    }
    async findNearest(location, limit = 10) {
        const sql = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM shelters 
      WHERE is_active = true
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      ORDER BY distance
      LIMIT $4
    `;
        const result = await this.executeQuery(sql, [
            location.longitude,
            location.latitude,
            location.radius || 10000,
            limit
        ]);
        return result.rows;
    }
    async findWithPagination(options) {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (options.conditions) {
            const { shelter_type, is_active, min_capacity, max_capacity, search } = options.conditions;
            if (shelter_type) {
                whereClause += ` AND shelter_type = $${paramIndex}`;
                params.push(shelter_type);
                paramIndex++;
            }
            if (is_active !== undefined) {
                whereClause += ` AND is_active = $${paramIndex}`;
                params.push(is_active);
                paramIndex++;
            }
            if (min_capacity) {
                whereClause += ` AND capacity >= $${paramIndex}`;
                params.push(min_capacity);
                paramIndex++;
            }
            if (max_capacity) {
                whereClause += ` AND capacity <= $${paramIndex}`;
                params.push(max_capacity);
                paramIndex++;
            }
            if (search) {
                whereClause += ` AND (name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }
        }
        const countSql = `SELECT COUNT(*) FROM shelters ${whereClause}`;
        const countResult = await this.executeQuery(countSql, params);
        const total = parseInt(countResult.rows[0].count);
        const dataSql = `
      SELECT * FROM shelters 
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
    async getStatistics() {
        const sql = `
      SELECT 
        COUNT(*) as total_shelters,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_shelters,
        SUM(capacity) as total_capacity,
        SUM(current_occupancy) as total_occupancy,
        ROUND(AVG(capacity), 2) as avg_capacity,
        ROUND(SUM(current_occupancy) * 100.0 / NULLIF(SUM(capacity), 0), 2) as occupancy_rate,
        COUNT(DISTINCT shelter_type) as shelter_types_count
      FROM shelters
    `;
        const result = await this.executeQuery(sql);
        return result.rows[0];
    }
    async getShelterTypes() {
        const sql = `
      SELECT DISTINCT shelter_type 
      FROM shelters 
      WHERE shelter_type IS NOT NULL 
      ORDER BY shelter_type
    `;
        const result = await this.executeQuery(sql);
        return result.rows.map(row => row.shelter_type);
    }
    async updateOccupancy(id, occupancy) {
        const sql = `
      UPDATE shelters 
      SET current_occupancy = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
        const result = await this.executeQuery(sql, [occupancy, id]);
        return result.rows[0] || null;
    }
    async getHighOccupancyShelters(threshold = 0.8) {
        const sql = `
      SELECT *,
        ROUND(current_occupancy * 100.0 / capacity, 2) as occupancy_rate
      FROM shelters 
      WHERE is_active = true 
        AND capacity > 0
        AND current_occupancy * 1.0 / capacity >= $1
      ORDER BY occupancy_rate DESC
    `;
        const result = await this.executeQuery(sql, [threshold]);
        return result.rows;
    }
    async findInArea(bounds) {
        const sql = `
      SELECT * FROM shelters 
      WHERE is_active = true
        AND location IS NOT NULL
        AND ST_Within(
          location,
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
      ORDER BY name
    `;
        const result = await this.executeQuery(sql, [
            bounds.minLng,
            bounds.minLat,
            bounds.maxLng,
            bounds.maxLat
        ]);
        return result.rows;
    }
    async checkAvailability(id) {
        const sql = `
      SELECT 
        capacity,
        current_occupancy,
        is_active,
        (capacity - current_occupancy) as remaining_capacity,
        ROUND(current_occupancy * 100.0 / capacity, 2) as occupancy_rate
      FROM shelters 
      WHERE id = $1
    `;
        const result = await this.executeQuery(sql, [id]);
        if (result.rows.length === 0) {
            throw new Error('避难场所不存在');
        }
        const shelter = result.rows[0];
        return {
            available: shelter.is_active && shelter.remaining_capacity > 0,
            remaining_capacity: shelter.remaining_capacity,
            occupancy_rate: shelter.occupancy_rate
        };
    }
}
exports.ShelterModel = ShelterModel;
//# sourceMappingURL=ShelterModel.js.map