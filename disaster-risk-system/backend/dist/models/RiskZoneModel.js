"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskZoneModel = void 0;
const BaseModel_1 = require("./BaseModel");
class RiskZoneModel extends BaseModel_1.BaseModel {
    constructor() {
        super('risk_zones');
    }
    async paginate(page = 1, limit = 10, conditions, sortBy, sortOrder) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (conditions) {
            if (conditions.name) {
                whereClause += ` AND rz.name ILIKE $${paramIndex}`;
                params.push(`%${conditions.name}%`);
                paramIndex++;
            }
            if (conditions.disaster_type_id) {
                whereClause += ` AND rz.disaster_type_id = $${paramIndex}`;
                params.push(conditions.disaster_type_id);
                paramIndex++;
            }
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
            if (conditions.is_monitored !== undefined) {
                whereClause += ` AND rz.is_monitored = $${paramIndex}`;
                params.push(conditions.is_monitored);
                paramIndex++;
            }
            const exactMatchFields = ['code', 'administrative_level'];
            exactMatchFields.forEach(field => {
                if (conditions[field]) {
                    whereClause += ` AND rz.${field} = $${paramIndex}`;
                    params.push(conditions[field]);
                    paramIndex++;
                }
            });
        }
        let orderClause = 'ORDER BY rz.created_at DESC';
        if (sortBy) {
            const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';
            orderClause = `ORDER BY rz.${sortBy} ${direction}`;
        }
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
        const processedData = dataResult.rows.map(row => {
            if (row.geometry_json) {
                row.geometry = JSON.parse(row.geometry_json);
                delete row.geometry_json;
            }
            if (row.disaster_type_id && row.disaster_type_name) {
                row.disaster_type = {
                    id: row.disaster_type_id,
                    name: row.disaster_type_name,
                    name_en: row.disaster_type_name_en,
                    description: row.disaster_type_description,
                    color_code: row.disaster_type_color
                };
                delete row.disaster_type_name;
                delete row.disaster_type_name_en;
                delete row.disaster_type_description;
                delete row.disaster_type_color;
            }
            else {
                row.disaster_type = null;
            }
            return row;
        });
        const countSql = `SELECT COUNT(*) as count FROM ${this.tableName} rz LEFT JOIN disaster_types dt ON rz.disaster_type_id = dt.id ${whereClause}`;
        const countParams = params.slice(0, -2);
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
    async findById(id) {
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
        if (row.geometry_json) {
            row.geometry = JSON.parse(row.geometry_json);
            delete row.geometry_json;
        }
        if (row.disaster_type_id && row.disaster_type_name) {
            row.disaster_type = {
                id: row.disaster_type_id,
                name: row.disaster_type_name,
                name_en: row.disaster_type_name_en,
                description: row.disaster_type_description,
                color_code: row.disaster_type_color
            };
            delete row.disaster_type_name;
            delete row.disaster_type_name_en;
            delete row.disaster_type_description;
            delete row.disaster_type_color;
        }
        else {
            row.disaster_type = null;
        }
        return row;
    }
    async findByCode(code) {
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
        if (row.geometry_json) {
            row.geometry = JSON.parse(row.geometry_json);
            delete row.geometry_json;
        }
        if (row.disaster_type_id && row.disaster_type_name) {
            row.disaster_type = {
                id: row.disaster_type_id,
                name: row.disaster_type_name,
                name_en: row.disaster_type_name_en,
                description: row.disaster_type_description,
                color_code: row.disaster_type_color
            };
            delete row.disaster_type_name;
            delete row.disaster_type_name_en;
            delete row.disaster_type_description;
            delete row.disaster_type_color;
        }
        else {
            row.disaster_type = null;
        }
        return row;
    }
    async createRiskZone(zoneData) {
        const fields = Object.keys(zoneData).filter(key => key !== 'geometry');
        const values = fields.map(key => zoneData[key]);
        let sql = `INSERT INTO risk_zones (${fields.join(', ')}`;
        let params = [...values];
        if (zoneData.geometry) {
            sql += ', geometry';
            const coordinates = zoneData.geometry.coordinates[0];
            const polygonText = `POLYGON((${coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
            sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')}, ST_GeomFromText($${params.length + 1}, 4326))`;
            params.push(polygonText);
        }
        else {
            sql += `) VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})`;
        }
        sql += ' RETURNING *';
        const result = await this.executeQuery(sql, params);
        return result.rows[0];
    }
    async updateRiskZone(id, zoneData) {
        const fields = Object.keys(zoneData).filter(key => key !== 'geometry' && key !== 'id');
        const values = fields.map(key => zoneData[key]);
        let setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        let params = [id, ...values];
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
    async findByLocation(location) {
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
    async findNearbyZones(location, radiusKm = 10) {
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
    async findByDisasterType(disasterTypeId) {
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
    async findByRiskLevel(minLevel, maxLevel = 5) {
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
    async getZoneStats() {
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
    async codeExists(code, excludeId) {
        let sql = 'SELECT 1 FROM risk_zones WHERE code = $1';
        const params = [code];
        if (excludeId) {
            sql += ' AND id != $2';
            params.push(excludeId.toString());
        }
        const result = await this.executeQuery(sql, params);
        return result.rows.length > 0;
    }
    async getZoneBounds(id) {
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
    async findOverlappingZones(geometry) {
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
    async getStatistics() {
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
        const [totalResult, highRiskResult, disasterTypeResult, riskLevelResult] = await Promise.all(queries.map(query => this.executeQuery(query)));
        const byDisasterType = {};
        disasterTypeResult.rows.forEach((row) => {
            byDisasterType[row.name] = parseInt(row.count);
        });
        const byRiskLevel = {};
        riskLevelResult.rows.forEach((row) => {
            byRiskLevel[`level${row.base_risk_level}`] = parseInt(row.count);
        });
        return {
            total: parseInt(totalResult.rows[0].total),
            highRisk: parseInt(highRiskResult.rows[0].count),
            byDisasterType,
            byRiskLevel
        };
    }
    async getRiskLevelDistribution() {
        const sql = 'SELECT base_risk_level, COUNT(*) as count FROM risk_zones GROUP BY base_risk_level ORDER BY base_risk_level';
        const result = await this.executeQuery(sql);
        const distribution = {
            level1: 0,
            level2: 0,
            level3: 0,
            level4: 0,
            level5: 0
        };
        result.rows.forEach((row) => {
            distribution[`level${row.base_risk_level}`] = parseInt(row.count);
        });
        return distribution;
    }
    static async findById(id) {
        const model = new RiskZoneModel();
        return await model.findById(id);
    }
    static async findByCode(code) {
        const model = new RiskZoneModel();
        const result = await model.findWhere({ code });
        return result[0] || null;
    }
    static async findByLocation(location) {
        const model = new RiskZoneModel();
        return await model.findByLocation(location);
    }
    static async update(id, data) {
        const model = new RiskZoneModel();
        return await model.update(id, data);
    }
    static async delete(id) {
        const model = new RiskZoneModel();
        return await model.delete(id);
    }
    static async getStatistics() {
        const model = new RiskZoneModel();
        return await model.getStatistics();
    }
    static async createZone(zoneData) {
        const model = new RiskZoneModel();
        return await model.createRiskZone(zoneData);
    }
    static async paginate(page, limit, filters, sortBy, sortOrder) {
        const model = new RiskZoneModel();
        return await model.paginate(page, limit, filters);
    }
}
exports.RiskZoneModel = RiskZoneModel;
//# sourceMappingURL=RiskZoneModel.js.map