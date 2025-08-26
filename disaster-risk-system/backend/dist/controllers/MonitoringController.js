"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringController = void 0;
const BaseController_1 = require("./BaseController");
const MonitoringDataModel_1 = require("../models/MonitoringDataModel");
const MonitoringStationModel_1 = require("../models/MonitoringStationModel");
const exceljs_1 = __importDefault(require("exceljs"));
class MonitoringController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.getMonitoringData = async (req, res) => {
            try {
                const { page, limit, offset } = this.getPaginationParams(req);
                const { sortBy = 'timestamp', sortOrder = 'DESC' } = this.getSortParams(req);
                const sortMap = {
                    'timestamp': 'md.timestamp',
                    'value': 'md.value',
                    'data_type': 'md.data_type',
                    'quality_flag': 'md.quality_flag',
                    'station_id': 'md.station_id',
                    'station_name': 'ms.name'
                };
                const orderByColumn = sortMap[sortBy] || 'md.timestamp';
                const { station_id, data_type, start_time, end_time, min_value, max_value, quality_flag } = req.query;
                let whereClause = 'WHERE 1=1';
                const params = [];
                let paramIndex = 1;
                if (station_id) {
                    whereClause += ` AND md.station_id = $${paramIndex++}`;
                    params.push(station_id);
                }
                if (data_type) {
                    whereClause += ` AND md.data_type = $${paramIndex++}`;
                    params.push(data_type);
                }
                if (start_time) {
                    whereClause += ` AND md.timestamp >= $${paramIndex++}`;
                    params.push(start_time);
                }
                if (end_time) {
                    whereClause += ` AND md.timestamp <= $${paramIndex++}`;
                    params.push(end_time);
                }
                if (min_value) {
                    whereClause += ` AND md.value >= $${paramIndex++}`;
                    params.push(parseFloat(min_value));
                }
                if (max_value) {
                    whereClause += ` AND md.value <= $${paramIndex++}`;
                    params.push(parseFloat(max_value));
                }
                if (quality_flag) {
                    whereClause += ` AND md.quality_flag = $${paramIndex++}`;
                    params.push(parseInt(quality_flag));
                }
                const exportParam = req.query.export;
                const isExport = exportParam === 'true' || exportParam === '1' || exportParam === true;
                if (isExport) {
                    if (!start_time || !end_time) {
                        this.error(res, '导出必须提供时间范围 start_time 和 end_time', 400);
                        return;
                    }
                    const exportQuery = `
          SELECT md.*, ms.name as station_name, ms.station_type
          FROM monitoring_data md
          LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
          ${whereClause}
          ORDER BY ${orderByColumn} ${sortOrder}
        `;
                    const exportResult = await this.monitoringModel.rawQuery(exportQuery, params);
                    const rows = exportResult.rows || [];
                    const filenameBase = `monitoring_export_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
                    const format = (req.query.format || 'csv').toLowerCase();
                    const headers = [
                        'id',
                        'station_id',
                        'station_name',
                        'station_type',
                        'data_type',
                        'value',
                        'unit',
                        'timestamp',
                        'quality_flag',
                        'raw_data',
                        'processed_data'
                    ];
                    if (format === 'excel') {
                        const workbook = new exceljs_1.default.Workbook();
                        const sheet = workbook.addWorksheet('MonitoringData');
                        sheet.columns = headers.map(h => ({ header: h, key: h, width: 22 }));
                        for (const r of rows) {
                            sheet.addRow({
                                id: r.id,
                                station_id: r.station_id,
                                station_name: r.station_name,
                                station_type: r.station_type,
                                data_type: r.data_type,
                                value: r.value,
                                unit: r.unit,
                                timestamp: new Date(r.timestamp).toISOString(),
                                quality_flag: r.quality_flag,
                                raw_data: r.raw_data ? JSON.stringify(r.raw_data) : '',
                                processed_data: r.processed_data ? JSON.stringify(r.processed_data) : ''
                            });
                        }
                        const buffer = await workbook.xlsx.writeBuffer();
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
                        res.status(200).send(Buffer.from(buffer));
                        return;
                    }
                    else {
                        const escapeCsv = (val) => {
                            if (val === null || val === undefined)
                                return '';
                            let str = typeof val === 'string' ? val : String(val);
                            str = str.replace(/"/g, '""');
                            if (/[",\n]/.test(str)) {
                                str = `"${str}"`;
                            }
                            return str;
                        };
                        const lines = [];
                        lines.push(headers.join(','));
                        for (const r of rows) {
                            const line = [
                                escapeCsv(r.id),
                                escapeCsv(r.station_id),
                                escapeCsv(r.station_name),
                                escapeCsv(r.station_type),
                                escapeCsv(r.data_type),
                                escapeCsv(r.value),
                                escapeCsv(r.unit),
                                escapeCsv(new Date(r.timestamp).toISOString()),
                                escapeCsv(r.quality_flag),
                                escapeCsv(r.raw_data ? JSON.stringify(r.raw_data) : ''),
                                escapeCsv(r.processed_data ? JSON.stringify(r.processed_data) : ''),
                            ].join(',');
                            lines.push(line);
                        }
                        const csvContent = '\ufeff' + lines.join('\n');
                        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
                        res.status(200).send(csvContent);
                        return;
                    }
                }
                const countQuery = `SELECT COUNT(*) as total FROM monitoring_data md ${whereClause}`;
                const countResult = await this.monitoringModel.customQuery(countQuery, params);
                const total = parseInt(countResult[0].total);
                const dataQuery = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        ${whereClause}
        ORDER BY ${orderByColumn} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
                params.push(limit, offset);
                const result = await this.monitoringModel.rawQuery(dataQuery, params);
                const data = result.rows;
                const pagination = {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                };
                this.paginated(res, data, pagination);
            }
            catch (error) {
                console.error('获取监测数据失败:', error);
                this.error(res, '获取监测数据失败: ' + error.message, 500);
            }
        };
        this.getNearbyMonitoringData = async (req, res) => {
            try {
                const { latitude, longitude, radius = 10000, data_type, limit = 50, hours = 24 } = req.query;
                if (!latitude || !longitude) {
                    this.error(res, '经纬度参数不能为空', 400);
                    return;
                }
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                const radiusMeters = parseFloat(radius);
                const limitNum = parseInt(limit);
                const hoursBack = parseInt(hours);
                let whereClause = `
        WHERE ST_DWithin(
          ms.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        AND md.timestamp >= NOW() - INTERVAL '${hoursBack} hours'
      `;
                const params = [lng, lat, radiusMeters];
                let paramIndex = 4;
                if (data_type) {
                    whereClause += ` AND md.data_type = $${paramIndex++}`;
                    params.push(data_type);
                }
                const nearbyDataQuery = `
        SELECT 
          md.*,
          ms.name as station_name,
          ms.station_type,
          ST_Distance(
            ms.location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) as distance_meters
        FROM monitoring_data md
        JOIN monitoring_stations ms ON md.station_id = ms.station_id
        ${whereClause}
        ORDER BY distance_meters ASC, md.timestamp DESC
        LIMIT $${paramIndex++}
      `;
                params.push(limitNum);
                const data = await this.monitoringModel.customQuery(nearbyDataQuery, params);
                this.success(res, data, '获取附近监测数据成功');
            }
            catch (error) {
                console.error('获取附近监测数据失败:', error);
                this.error(res, '获取附近监测数据失败: ' + error.message, 500);
            }
        };
        this.addMonitoringData = async (req, res) => {
            try {
                const requiredFields = ['station_id', 'data_type', 'value', 'timestamp'];
                const validation = this.validateRequired(req.body, requiredFields);
                if (validation) {
                    this.error(res, validation, 400);
                    return;
                }
                const { station_id, data_type, value, unit, timestamp, quality_flag = 1, raw_data, processed_data } = req.body;
                const stationExistsQuery = 'SELECT station_id FROM monitoring_stations WHERE station_id = $1 AND is_active = true';
                const stationExists = await this.stationModel.customQuery(stationExistsQuery, [station_id]);
                if (stationExists.length === 0) {
                    this.error(res, '监测站点不存在或未激活', 400);
                    return;
                }
                const insertQuery = `
        INSERT INTO monitoring_data (
          station_id, data_type, value, unit, timestamp, 
          quality_flag, raw_data, processed_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
                const params = [
                    station_id,
                    data_type,
                    parseFloat(value),
                    unit,
                    new Date(timestamp).toISOString(),
                    quality_flag,
                    raw_data,
                    processed_data
                ];
                const result = await this.monitoringModel.customQuery(insertQuery, params);
                this.created(res, result[0], '监测数据添加成功');
            }
            catch (error) {
                console.error('添加监测数据失败:', error);
                this.error(res, '添加监测数据失败: ' + error.message, 500);
            }
        };
        this.batchAddMonitoringData = async (req, res) => {
            try {
                const { data } = req.body;
                if (!Array.isArray(data) || data.length === 0) {
                    this.error(res, '数据格式不正确，需要提供数据数组', 400);
                    return;
                }
                const requiredFields = ['station_id', 'data_type', 'value', 'timestamp'];
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    for (const field of requiredFields) {
                        if (!item[field] && item[field] !== 0) {
                            this.error(res, `第${i + 1}条数据缺少必需字段: ${field}`, 400);
                            return;
                        }
                    }
                }
                const values = [];
                const params = [];
                let paramIndex = 1;
                for (const item of data) {
                    const valueClause = `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`;
                    values.push(valueClause);
                    params.push(item.station_id, item.data_type, parseFloat(item.value), item.unit || null, new Date(item.timestamp).toISOString(), item.quality_flag || 1, item.raw_data || null, item.processed_data || null);
                }
                const insertQuery = `
        INSERT INTO monitoring_data (
          station_id, data_type, value, unit, timestamp, 
          quality_flag, raw_data, processed_data
        ) VALUES ${values.join(', ')}
        RETURNING *
      `;
                const results = await this.monitoringModel.customQuery(insertQuery, params);
                this.created(res, { count: results.length, data: results }, `成功添加${results.length}条监测数据`);
            }
            catch (error) {
                console.error('批量添加监测数据失败:', error);
                this.error(res, '批量添加监测数据失败: ' + error.message, 500);
            }
        };
        this.getStationStatistics = async (req, res) => {
            try {
                const { station_id, data_type, start_time, end_time } = req.query;
                if (!station_id) {
                    this.error(res, '站点ID不能为空', 400);
                    return;
                }
                let whereClause = 'WHERE station_id = $1';
                const params = [station_id];
                let paramIndex = 2;
                if (data_type) {
                    whereClause += ` AND data_type = $${paramIndex++}`;
                    params.push(data_type);
                }
                if (start_time) {
                    whereClause += ` AND timestamp >= $${paramIndex++}`;
                    params.push(start_time);
                }
                if (end_time) {
                    whereClause += ` AND timestamp <= $${paramIndex++}`;
                    params.push(end_time);
                }
                const statisticsQuery = `
        SELECT 
          data_type,
          COUNT(*) as count,
          AVG(value) as average,
          MIN(value) as min_value,
          MAX(value) as max_value,
          STDDEV(value) as standard_deviation,
          MIN(timestamp) as earliest_time,
          MAX(timestamp) as latest_time
        FROM monitoring_data 
        ${whereClause}
        GROUP BY data_type
        ORDER BY data_type
      `;
                const statistics = await this.monitoringModel.customQuery(statisticsQuery, params);
                this.success(res, statistics, '获取站点统计信息成功');
            }
            catch (error) {
                console.error('获取站点统计信息失败:', error);
                this.error(res, '获取站点统计信息失败: ' + error.message, 500);
            }
        };
        this.getDataTypes = async (req, res) => {
            try {
                const dataTypesQuery = `
        SELECT 
          data_type,
          COUNT(*) as count,
          MIN(unit) as unit,
          MIN(timestamp) as first_recorded,
          MAX(timestamp) as last_recorded
        FROM monitoring_data 
        GROUP BY data_type 
        ORDER BY count DESC
      `;
                const dbDataTypes = await this.monitoringModel.customQuery(dataTypesQuery, []);
                const predefinedTypes = [
                    { type: 'temperature', name: '温度', unit: '°C', description: '环境温度监测' },
                    { type: 'humidity', name: '湿度', unit: '%', description: '空气湿度监测' },
                    { type: 'rainfall', name: '降雨量', unit: 'mm', description: '降水量监测' },
                    { type: 'wind_speed', name: '风速', unit: 'm/s', description: '风速监测' },
                    { type: 'wind_direction', name: '风向', unit: '°', description: '风向监测' },
                    { type: 'pressure', name: '气压', unit: 'hPa', description: '大气压力监测' },
                    { type: 'groundwater', name: '地下水位', unit: 'm', description: '地下水位监测' },
                    { type: 'slope_displacement', name: '坡面位移', unit: 'mm', description: '坡面位移监测' },
                    { type: 'soil_moisture', name: '土壤湿度', unit: '%', description: '土壤含水量监测' },
                    { type: 'seismic_activity', name: '地震活动', unit: 'magnitude', description: '地震活动监测' },
                    { type: 'water_level', name: '水位', unit: 'm', description: '河流/湖泊水位监测' },
                    { type: 'flow_rate', name: '流量', unit: 'm³/s', description: '水流量监测' }
                ];
                const dataTypes = predefinedTypes.map(predefined => {
                    const dbData = dbDataTypes.find((db) => db.data_type === predefined.type);
                    return {
                        ...predefined,
                        count: dbData ? parseInt(dbData.count) : 0,
                        unit: dbData?.unit || predefined.unit,
                        first_recorded: dbData?.first_recorded,
                        last_recorded: dbData?.last_recorded,
                        is_active: !!dbData
                    };
                });
                this.success(res, dataTypes, '获取数据类型成功');
            }
            catch (error) {
                console.error('获取数据类型失败:', error);
                this.error(res, '获取数据类型失败: ' + error.message, 500);
            }
        };
        this.getStations = async (req, res) => {
            try {
                const { page, limit, offset } = this.getPaginationParams(req);
                const { sortBy = 'created_at', sortOrder = 'DESC' } = this.getSortParams(req);
                const stationSortMap = {
                    'created_at': 'ms.created_at',
                    'name': 'ms.name',
                    'station_id': 'ms.station_id',
                    'station_type': 'ms.station_type',
                    'zone_id': 'ms.zone_id',
                    'is_active': 'ms.is_active',
                    'installation_status': 'ms.installation_status',
                    'last_data_time': 'last_data_time'
                };
                const stationsOrderBy = stationSortMap[sortBy] || 'ms.created_at';
                const { name, station_type, zone_id, is_active, installation_status } = req.query;
                let whereClause = 'WHERE 1=1';
                const params = [];
                let paramIndex = 1;
                if (name) {
                    whereClause += ` AND (ms.name ILIKE $${paramIndex++} OR ms.station_id ILIKE $${paramIndex++})`;
                    params.push(`%${name}%`, `%${name}%`);
                }
                if (station_type) {
                    whereClause += ` AND ms.station_type = $${paramIndex++}`;
                    params.push(station_type);
                }
                if (zone_id) {
                    whereClause += ` AND ms.zone_id = $${paramIndex++}`;
                    params.push(parseInt(zone_id));
                }
                if (is_active !== undefined) {
                    whereClause += ` AND ms.is_active = $${paramIndex++}`;
                    params.push(is_active === 'true');
                }
                if (installation_status) {
                    whereClause += ` AND ms.installation_status = $${paramIndex++}`;
                    params.push(installation_status);
                }
                const countQuery = `SELECT COUNT(*) as total FROM monitoring_stations ${whereClause}`;
                const countResult = await this.stationModel.customQuery(countQuery, params);
                const total = parseInt(countResult[0].total);
                const dataQuery = `
        SELECT 
          ms.*, 
          rz.name as zone_name,
          ST_AsText(ms.location) as location_wkt,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude,
          (SELECT MAX(md.timestamp) 
             FROM monitoring_data md 
             WHERE md.station_id = ms.station_id) as last_data_time
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        ${whereClause}
        ORDER BY ${stationsOrderBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
                params.push(limit, offset);
                const data = await this.stationModel.customQuery(dataQuery, params);
                const pagination = {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                };
                this.paginated(res, data, pagination);
            }
            catch (error) {
                console.error('获取监测站点失败:', error);
                this.error(res, '获取监测站点失败: ' + error.message, 500);
            }
        };
        this.createStation = async (req, res) => {
            try {
                const stationData = req.body;
                const requiredFields = ['station_id', 'name', 'station_type'];
                const validation = this.validateRequired(stationData, requiredFields);
                if (validation) {
                    this.error(res, validation, 400);
                    return;
                }
                const existsQuery = 'SELECT id FROM monitoring_stations WHERE station_id = $1';
                const existsResult = await this.stationModel.customQuery(existsQuery, [stationData.station_id]);
                if (existsResult.length > 0) {
                    this.error(res, '站点编号已存在', 400);
                    return;
                }
                if (stationData.longitude && stationData.latitude) {
                    stationData.location = `POINT(${stationData.longitude} ${stationData.latitude})`;
                }
                const insertData = {
                    station_id: stationData.station_id,
                    name: stationData.name,
                    station_type: stationData.station_type,
                    location: stationData.location,
                    zone_id: stationData.zone_id,
                    equipment_info: stationData.equipment_info,
                    installation_date: stationData.installation_date,
                    maintenance_schedule: stationData.maintenance_schedule,
                    data_transmission_interval: stationData.data_transmission_interval || 300,
                    is_active: stationData.is_active !== undefined ? stationData.is_active : true
                };
                const station = await this.stationModel.create(insertData);
                this.created(res, station, '监测站创建成功');
            }
            catch (error) {
                console.error('创建监测站失败:', error);
                this.error(res, '创建监测站失败: ' + error.message, 500);
            }
        };
        this.updateStation = async (req, res) => {
            try {
                const { id } = req.params;
                const stationData = req.body;
                if (!id) {
                    this.error(res, '监测站ID不能为空', 400);
                    return;
                }
                const existsQuery = 'SELECT id FROM monitoring_stations WHERE id = $1';
                const existsResult = await this.stationModel.customQuery(existsQuery, [parseInt(id)]);
                if (existsResult.length === 0) {
                    this.error(res, '监测站不存在', 404);
                    return;
                }
                if (stationData.station_id) {
                    const duplicateQuery = 'SELECT id FROM monitoring_stations WHERE station_id = $1 AND id != $2';
                    const duplicateResult = await this.stationModel.customQuery(duplicateQuery, [stationData.station_id, parseInt(id)]);
                    if (duplicateResult.length > 0) {
                        this.error(res, '站点编号已存在', 400);
                        return;
                    }
                }
                if (stationData.longitude && stationData.latitude) {
                    stationData.location = `POINT(${stationData.longitude} ${stationData.latitude})`;
                }
                const updateFields = [];
                const params = [];
                let paramIndex = 1;
                const allowedFields = [
                    'station_id', 'name', 'station_type', 'location',
                    'zone_id', 'equipment_info', 'installation_date',
                    'maintenance_schedule', 'data_transmission_interval', 'is_active'
                ];
                for (const field of allowedFields) {
                    if (stationData[field] !== undefined) {
                        updateFields.push(`${field} = $${paramIndex++}`);
                        params.push(stationData[field]);
                    }
                }
                if (updateFields.length === 0) {
                    this.error(res, '没有提供需要更新的字段', 400);
                    return;
                }
                updateFields.push('updated_at = CURRENT_TIMESTAMP');
                params.push(parseInt(id));
                const updateQuery = `
        UPDATE monitoring_stations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
                const result = await this.stationModel.customQuery(updateQuery, params);
                this.success(res, result[0], '监测站更新成功');
            }
            catch (error) {
                console.error('更新监测站失败:', error);
                this.error(res, '更新监测站失败: ' + error.message, 500);
            }
        };
        this.deleteStation = async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    this.error(res, '监测站ID不能为空', 400);
                    return;
                }
                const dataCountQuery = `
        SELECT COUNT(*) as count 
        FROM monitoring_data md
        JOIN monitoring_stations ms ON md.station_id = ms.station_id
        WHERE ms.id = $1
      `;
                const dataCountResult = await this.monitoringModel.customQuery(dataCountQuery, [parseInt(id)]);
                const dataCount = parseInt(dataCountResult[0].count);
                if (dataCount > 0) {
                    this.error(res, `无法删除监测站，存在 ${dataCount} 条关联的监测数据。请先删除相关数据或将站点设为非活跃状态。`, 400);
                    return;
                }
                const deleteQuery = 'DELETE FROM monitoring_stations WHERE id = $1';
                const result = await this.stationModel.customQuery(deleteQuery, [parseInt(id)]);
                if (result.length === 0) {
                    this.error(res, '监测站不存在', 404);
                    return;
                }
                this.success(res, null, '监测站删除成功');
            }
            catch (error) {
                console.error('删除监测站失败:', error);
                this.error(res, '删除监测站失败: ' + error.message, 500);
            }
        };
        this.getStationDetail = async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    this.error(res, '监测站ID不能为空', 400);
                    return;
                }
                const stationQuery = `
        SELECT 
          ms.*,
          rz.name as zone_name,
          rz.base_risk_level,
          ST_X(ms.location) as longitude,
          ST_Y(ms.location) as latitude,
          (
            SELECT COUNT(*) 
            FROM monitoring_data md 
            WHERE md.station_id = ms.station_id 
            AND md.timestamp >= NOW() - INTERVAL '24 hours'
          ) as data_count_24h,
          (
            SELECT MAX(md.timestamp) 
            FROM monitoring_data md 
            WHERE md.station_id = ms.station_id
          ) as last_data_time
        FROM monitoring_stations ms
        LEFT JOIN risk_zones rz ON ms.zone_id = rz.id
        WHERE ms.id = $1
      `;
                const result = await this.stationModel.customQuery(stationQuery, [parseInt(id)]);
                if (result.length === 0) {
                    this.error(res, '监测站不存在', 404);
                    return;
                }
                const station = result[0];
                const recentDataQuery = `
        SELECT data_type, value, unit, timestamp, quality_flag
        FROM monitoring_data 
        WHERE station_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 10
      `;
                const recentData = await this.monitoringModel.customQuery(recentDataQuery, [station.station_id]);
                station.recent_data = recentData;
                this.success(res, station, '获取监测站详情成功');
            }
            catch (error) {
                console.error('获取监测站详情失败:', error);
                this.error(res, '获取监测站详情失败: ' + error.message, 500);
            }
        };
        this.batchUpdateStationStatus = async (req, res) => {
            try {
                const { station_ids, is_active, installation_status } = req.body;
                if (!Array.isArray(station_ids) || station_ids.length === 0) {
                    this.error(res, '监测站ID列表不能为空', 400);
                    return;
                }
                let updateFields = [];
                const params = [];
                let paramIndex = 1;
                if (typeof is_active === 'boolean') {
                    updateFields.push(`is_active = $${paramIndex++}`);
                    params.push(is_active);
                }
                if (installation_status) {
                    updateFields.push(`installation_status = $${paramIndex++}`);
                    params.push(installation_status);
                }
                if (updateFields.length === 0) {
                    this.error(res, '至少需要提供一个更新字段', 400);
                    return;
                }
                updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
                const placeholders = station_ids.map((_, index) => `$${paramIndex + index}`).join(',');
                params.push(...station_ids);
                const updateQuery = `
        UPDATE monitoring_stations 
        SET ${updateFields.join(', ')}
        WHERE id IN (${placeholders})
      `;
                const result = await this.stationModel.customQuery(updateQuery, params);
                this.success(res, { updated_count: result.length }, `成功更新 ${result.length} 个监测站状态`);
            }
            catch (error) {
                console.error('批量更新监测站状态失败:', error);
                this.error(res, '批量更新监测站状态失败: ' + error.message, 500);
            }
        };
        this.getRealtimeData = async (req, res) => {
            try {
                const { station_id, data_type, minutes = 60, limit = 100 } = req.query;
                let whereClause = 'WHERE 1=1';
                const params = [];
                let paramIndex = 1;
                if (station_id) {
                    whereClause += ` AND md.station_id = $${paramIndex++}`;
                    params.push(station_id);
                }
                if (data_type) {
                    whereClause += ` AND md.data_type = $${paramIndex++}`;
                    params.push(data_type);
                }
                const endTime = new Date();
                const startTime = new Date(endTime.getTime() - parseInt(minutes) * 60 * 1000);
                whereClause += ` AND md.timestamp >= $${paramIndex++} AND md.timestamp <= $${paramIndex++}`;
                params.push(startTime.toISOString(), endTime.toISOString());
                const dataQuery = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        ${whereClause}
        ORDER BY md.timestamp DESC
        LIMIT $${paramIndex++}
      `;
                params.push(parseInt(limit));
                const result = await this.monitoringModel.rawQuery(dataQuery, params);
                const data = result.rows;
                this.success(res, data, '获取实时监测数据成功');
            }
            catch (error) {
                console.error('获取实时监测数据失败:', error);
                this.error(res, '获取实时监测数据失败: ' + error.message, 500);
            }
        };
        this.deleteMonitoringData = async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    this.error(res, '数据ID不能为空', 400);
                    return;
                }
                const result = await this.monitoringModel.deleteById(parseInt(id));
                if (!result) {
                    this.error(res, '监测数据不存在', 404);
                    return;
                }
                this.success(res, null, '删除监测数据成功');
            }
            catch (error) {
                console.error('删除监测数据失败:', error);
                this.error(res, '删除监测数据失败: ' + error.message, 500);
            }
        };
        this.updateMonitoringData = async (req, res) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                if (!id) {
                    this.error(res, '数据ID不能为空', 400);
                    return;
                }
                const allowedFields = [
                    'value', 'unit', 'quality_flag', 'raw_data', 'processed_data'
                ];
                const finalUpdateData = {};
                for (const field of allowedFields) {
                    if (updateData[field] !== undefined) {
                        finalUpdateData[field] = updateData[field];
                    }
                }
                if (Object.keys(finalUpdateData).length === 0) {
                    this.error(res, '没有提供需要更新的字段', 400);
                    return;
                }
                const result = await this.monitoringModel.updateById(parseInt(id), finalUpdateData);
                if (!result) {
                    this.error(res, '监测数据不存在', 404);
                    return;
                }
                this.success(res, result, '更新监测数据成功');
            }
            catch (error) {
                console.error('更新监测数据失败:', error);
                this.error(res, '更新监测数据失败: ' + error.message, 500);
            }
        };
        this.getAnomalousData = async (req, res) => {
            try {
                const { station_id, hours = 24 } = req.query;
                let whereClause = `WHERE md.timestamp >= NOW() - INTERVAL '${hours} hours'
        AND (md.quality_flag = 0 OR md.value IS NULL)`;
                const params = [];
                let paramIndex = 1;
                if (station_id) {
                    whereClause += ` AND md.station_id = $${paramIndex++}`;
                    params.push(station_id);
                }
                const sql = `
        SELECT md.*, ms.name as station_name, ms.station_type
        FROM monitoring_data md
        LEFT JOIN monitoring_stations ms ON md.station_id = ms.station_id
        ${whereClause}
        ORDER BY md.timestamp DESC 
        LIMIT 100
      `;
                const result = await this.monitoringModel.customQuery(sql, params);
                this.success(res, result, '获取异常监测数据成功');
            }
            catch (error) {
                console.error('获取异常监测数据失败:', error);
                this.error(res, '获取异常监测数据失败: ' + error.message, 500);
            }
        };
        this.getDataQualityReport = async (req, res) => {
            try {
                const { station_id, hours = 24 } = req.query;
                let whereClause = `WHERE timestamp >= NOW() - INTERVAL '${hours} hours'`;
                const params = [];
                let paramIndex = 1;
                if (station_id) {
                    whereClause += ` AND station_id = $${paramIndex++}`;
                    params.push(station_id);
                }
                const sql = `
        SELECT 
          data_type,
          COUNT(*) as total_records,
          COUNT(CASE WHEN quality_flag >= 3 THEN 1 END) as high_quality,
          COUNT(CASE WHEN quality_flag = 2 THEN 1 END) as medium_quality,
          COUNT(CASE WHEN quality_flag = 1 THEN 1 END) as low_quality,
          COUNT(CASE WHEN quality_flag = 0 THEN 1 END) as invalid_data,
          ROUND(COUNT(CASE WHEN quality_flag >= 2 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as quality_percentage
        FROM monitoring_data 
        ${whereClause}
        GROUP BY data_type 
        ORDER BY data_type
      `;
                const result = await this.monitoringModel.customQuery(sql, params);
                this.success(res, result, '获取数据质量报告成功');
            }
            catch (error) {
                console.error('获取数据质量报告失败:', error);
                this.error(res, '获取数据质量报告失败: ' + error.message, 500);
            }
        };
        this.getDataTrend = async (req, res) => {
            try {
                const { station_id, data_type, hours = 24, interval = '1 hour' } = req.query;
                if (!station_id || !data_type) {
                    this.error(res, '缺少必要参数: station_id, data_type', 400);
                    return;
                }
                const sql = `
        SELECT 
          DATE_TRUNC($4, timestamp) as time_bucket,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as data_count,
          AVG(CASE WHEN quality_flag >= 3 THEN 1.0 ELSE 0.0 END) as quality_ratio
        FROM monitoring_data 
        WHERE station_id = $1 
          AND data_type = $2 
          AND timestamp >= NOW() - INTERVAL '${hours} hours'
          AND quality_flag >= 1
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
      `;
                const result = await this.monitoringModel.customQuery(sql, [station_id, data_type, hours, interval]);
                this.success(res, result, '获取数据趋势成功');
            }
            catch (error) {
                console.error('获取数据趋势失败:', error);
                this.error(res, '获取数据趋势失败: ' + error.message, 500);
            }
        };
        this.monitoringModel = new MonitoringDataModel_1.MonitoringDataModel();
        this.stationModel = new MonitoringStationModel_1.MonitoringStationModel();
    }
}
exports.MonitoringController = MonitoringController;
//# sourceMappingURL=MonitoringController.js.map