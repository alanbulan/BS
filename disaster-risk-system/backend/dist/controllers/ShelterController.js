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
exports.ShelterController = void 0;
const BaseController_1 = require("./BaseController");
const ShelterModel_1 = require("../models/ShelterModel");
const ExcelJS = __importStar(require("exceljs"));
class ShelterController extends BaseController_1.BaseController {
    constructor() {
        super();
        this.getShelters = this.asyncHandler(async (req, res) => {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { sortBy, sortOrder } = this.getSortParams(req);
            const { shelter_type, is_active, min_capacity, max_capacity, search } = req.query;
            const conditions = {};
            if (shelter_type)
                conditions.shelter_type = shelter_type;
            if (is_active !== undefined)
                conditions.is_active = is_active === 'true';
            if (min_capacity)
                conditions.min_capacity = parseInt(min_capacity);
            if (max_capacity)
                conditions.max_capacity = parseInt(max_capacity);
            if (search)
                conditions.search = search;
            const result = await this.shelterModel.findWithPagination({
                conditions,
                pagination: { page, limit, offset },
                sort: { field: sortBy, order: sortOrder }
            });
            const processedData = result.data.map((shelter) => {
                let contact_person = '';
                let contact_phone = '';
                let management_agency = '';
                if (shelter.contact_info) {
                    try {
                        const contactInfo = typeof shelter.contact_info === 'string'
                            ? JSON.parse(shelter.contact_info)
                            : shelter.contact_info;
                        contact_person = contactInfo?.contact_person
                            || contactInfo?.person
                            || contactInfo?.contact
                            || contactInfo?.manager
                            || '';
                        contact_phone = contactInfo?.contact_phone
                            || contactInfo?.phone
                            || contactInfo?.emergency_phone
                            || '';
                        management_agency = contactInfo?.management_agency
                            || contactInfo?.agency
                            || contactInfo?.manager
                            || '';
                    }
                    catch (e) {
                        console.warn('解析 contact_info 失败:', e);
                    }
                }
                let status = 'unavailable';
                if (shelter.is_active) {
                    if (typeof shelter.current_occupancy === 'number' &&
                        typeof shelter.capacity === 'number' &&
                        shelter.current_occupancy >= shelter.capacity) {
                        status = 'full';
                    }
                    else if (shelter.maintenance_status === 'maintenance') {
                        status = 'maintenance';
                    }
                    else {
                        status = 'available';
                    }
                }
                return {
                    shelter_id: shelter.id,
                    ...shelter,
                    status,
                    contact_person,
                    contact_phone,
                    management_agency
                };
            });
            this.paginated(res, processedData, result.pagination);
        });
        this.getNearestShelters = this.asyncHandler(async (req, res) => {
            const { latitude, longitude, radius = 10000, limit = 10 } = req.query;
            if (!latitude || !longitude) {
                this.error(res, '经纬度参数不能为空', 400);
                return;
            }
            const location = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseFloat(radius)
            };
            const shelters = await this.shelterModel.findNearest(location, parseInt(limit));
            const sheltersWithDistance = shelters.map((shelter) => {
                if (shelter.location) {
                    const distance = this.calculateDistance({ coordinates: [location.longitude, location.latitude] }, shelter.location);
                    return { ...shelter, distance: Math.round(distance) };
                }
                return shelter;
            });
            this.success(res, sheltersWithDistance, '获取最近避难场所成功');
        });
        this.getShelterById = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            if (!id) {
                this.error(res, '避难场所ID不能为空', 400);
                return;
            }
            const shelter = await this.shelterModel.findById(parseInt(id));
            if (!shelter) {
                this.notFound(res, '避难场所不存在');
                return;
            }
            this.success(res, shelter, '获取避难场所详情成功');
        });
        this.createShelter = this.asyncHandler(async (req, res) => {
            const requiredFields = ['name', 'capacity'];
            const validation = this.validateRequired(req.body, requiredFields);
            if (validation) {
                this.error(res, validation, 400);
                return;
            }
            const { name, location, address, capacity, current_occupancy = 0, shelter_type, facilities, contact_info, access_routes, elevation, safety_level, operating_hours, special_requirements, is_active } = req.body;
            if (capacity <= 0) {
                this.error(res, '容量必须大于0', 400);
                return;
            }
            if (current_occupancy < 0 || current_occupancy > capacity) {
                this.error(res, '当前占用人数不能小于0或大于容量', 400);
                return;
            }
            const shelterData = {
                name,
                location,
                address,
                capacity,
                current_occupancy,
                shelter_type,
                facilities,
                contact_info,
                access_routes,
                elevation,
                safety_level,
                operating_hours,
                special_requirements,
                is_active: is_active ?? true
            };
            const result = await this.shelterModel.create(shelterData);
            this.created(res, result, '创建避难场所成功');
        });
        this.updateShelter = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            if (!id) {
                this.error(res, '避难场所ID不能为空', 400);
                return;
            }
            delete updateData.id;
            delete updateData.created_at;
            if (updateData.capacity !== undefined && updateData.capacity <= 0) {
                this.error(res, '容量必须大于0', 400);
                return;
            }
            if (updateData.current_occupancy !== undefined && updateData.current_occupancy < 0) {
                this.error(res, '当前占用人数不能小于0', 400);
                return;
            }
            const result = await this.shelterModel.update(parseInt(id), updateData);
            if (!result) {
                this.notFound(res, '避难场所不存在');
                return;
            }
            this.success(res, result, '更新避难场所成功');
        });
        this.deleteShelter = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            if (!id) {
                this.error(res, '避难场所ID不能为空', 400);
                return;
            }
            const shelter = await this.shelterModel.findById(parseInt(id));
            if (!shelter) {
                this.notFound(res, '避难场所不存在');
                return;
            }
            await this.shelterModel.delete(parseInt(id));
            this.success(res, null, '删除避难场所成功');
        });
        this.batchDelete = this.asyncHandler(async (req, res) => {
            const { shelter_ids } = req.body;
            if (!shelter_ids || !Array.isArray(shelter_ids) || shelter_ids.length === 0) {
                this.error(res, '避难场所ID列表不能为空', 400);
                return;
            }
            const invalidIds = shelter_ids.filter(id => !Number.isInteger(id) || id <= 0);
            if (invalidIds.length > 0) {
                this.error(res, '包含无效的避难场所ID', 400);
                return;
            }
            try {
                const existingShelters = await this.shelterModel.findWhere({
                    field: 'id',
                    operator: 'IN',
                    value: shelter_ids
                });
                if (existingShelters.length !== shelter_ids.length) {
                    const existingIds = existingShelters.map((s) => s.id);
                    const notFoundIds = shelter_ids.filter(id => !existingIds.includes(id));
                    this.error(res, `以下避难场所不存在: ${notFoundIds.join(', ')}`, 400);
                    return;
                }
                const sql = `DELETE FROM shelters WHERE id = ANY($1)`;
                await this.shelterModel.rawQuery(sql, [shelter_ids]);
                this.success(res, { deleted_count: shelter_ids.length }, '批量删除避难场所成功');
            }
            catch (error) {
                console.error('批量删除避难场所失败:', error);
                this.serverError(res, '批量删除避难场所失败');
            }
        });
        this.batchUpdateStatus = this.asyncHandler(async (req, res) => {
            const { shelter_ids, is_active } = req.body;
            if (!shelter_ids || !Array.isArray(shelter_ids) || shelter_ids.length === 0) {
                this.error(res, '避难场所ID列表不能为空', 400);
                return;
            }
            if (typeof is_active !== 'boolean') {
                this.error(res, '状态值必须为布尔类型', 400);
                return;
            }
            const invalidIds = shelter_ids.filter(id => !Number.isInteger(id) || id <= 0);
            if (invalidIds.length > 0) {
                this.error(res, '包含无效的避难场所ID', 400);
                return;
            }
            try {
                const existingShelters = await this.shelterModel.findWhere({
                    field: 'id',
                    operator: 'IN',
                    value: shelter_ids
                });
                if (existingShelters.length !== shelter_ids.length) {
                    const existingIds = existingShelters.map((s) => s.id);
                    const notFoundIds = shelter_ids.filter(id => !existingIds.includes(id));
                    this.error(res, `以下避难场所不存在: ${notFoundIds.join(', ')}`, 400);
                    return;
                }
                const sql = `
        UPDATE shelters 
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ANY($2)
        RETURNING id, name, is_active
      `;
                const result = await this.shelterModel.rawQuery(sql, [is_active, shelter_ids]);
                this.success(res, {
                    updated_count: result.rows.length,
                    updated_shelters: result.rows
                }, '批量更新避难场所状态成功');
            }
            catch (error) {
                console.error('批量更新避难场所状态失败:', error);
                this.serverError(res, '批量更新避难场所状态失败');
            }
        });
        this.exportShelters = this.asyncHandler(async (req, res) => {
            const { format = 'excel' } = req.query;
            try {
                const sql = `
        SELECT 
          id,
          name,
          address,
          capacity,
          current_occupancy,
          shelter_type,
          is_active,
          safety_level,
          elevation,
          ST_X(location) as longitude,
          ST_Y(location) as latitude,
          facilities,
          contact_info,
          operating_hours,
          special_requirements,
          created_at,
          updated_at
        FROM shelters
        ORDER BY id
      `;
                const result = await this.shelterModel.rawQuery(sql);
                const shelters = result.rows;
                if (format === 'csv') {
                    const csvHeader = [
                        'ID', '名称', '地址', '容量', '当前占用', '类型', '状态',
                        '安全级别', '海拔', '经度', '纬度', '设施', '联系信息',
                        '开放时间', '特殊要求', '创建时间', '更新时间'
                    ].join(',');
                    const csvRows = shelters.map(shelter => [
                        shelter.id,
                        `"${shelter.name || ''}"`,
                        `"${shelter.address || ''}"`,
                        shelter.capacity,
                        shelter.current_occupancy,
                        `"${shelter.shelter_type || ''}"`,
                        shelter.is_active ? '启用' : '禁用',
                        `"${shelter.safety_level || ''}"`,
                        shelter.elevation || '',
                        shelter.longitude || '',
                        shelter.latitude || '',
                        `"${shelter.facilities ? JSON.stringify(shelter.facilities) : ''}"`,
                        `"${shelter.contact_info ? JSON.stringify(shelter.contact_info) : ''}"`,
                        `"${shelter.operating_hours ? JSON.stringify(shelter.operating_hours) : ''}"`,
                        `"${shelter.special_requirements || ''}"`,
                        shelter.created_at ? new Date(shelter.created_at).toLocaleString('zh-CN') : '',
                        shelter.updated_at ? new Date(shelter.updated_at).toLocaleString('zh-CN') : ''
                    ].join(','));
                    const csvContent = [csvHeader, ...csvRows].join('\n');
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename=shelters_${new Date().toISOString().split('T')[0]}.csv`);
                    res.send('\ufeff' + csvContent);
                }
                else {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('避难场所数据');
                    worksheet.columns = [
                        { header: 'ID', key: 'id', width: 10 },
                        { header: '名称', key: 'name', width: 20 },
                        { header: '地址', key: 'address', width: 30 },
                        { header: '容量', key: 'capacity', width: 10 },
                        { header: '当前占用', key: 'current_occupancy', width: 12 },
                        { header: '类型', key: 'shelter_type', width: 15 },
                        { header: '状态', key: 'status', width: 10 },
                        { header: '安全级别', key: 'safety_level', width: 12 },
                        { header: '海拔(米)', key: 'elevation', width: 10 },
                        { header: '经度', key: 'longitude', width: 12 },
                        { header: '纬度', key: 'latitude', width: 12 },
                        { header: '设施信息', key: 'facilities', width: 25 },
                        { header: '联系信息', key: 'contact_info', width: 25 },
                        { header: '开放时间', key: 'operating_hours', width: 20 },
                        { header: '特殊要求', key: 'special_requirements', width: 25 },
                        { header: '创建时间', key: 'created_at', width: 20 },
                        { header: '更新时间', key: 'updated_at', width: 20 }
                    ];
                    const headerRow = worksheet.getRow(1);
                    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    headerRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF366092' }
                    };
                    shelters.forEach(shelter => {
                        worksheet.addRow({
                            id: shelter.id,
                            name: shelter.name,
                            address: shelter.address,
                            capacity: shelter.capacity,
                            current_occupancy: shelter.current_occupancy,
                            shelter_type: shelter.shelter_type,
                            status: shelter.is_active ? '启用' : '禁用',
                            safety_level: shelter.safety_level,
                            elevation: shelter.elevation,
                            longitude: shelter.longitude,
                            latitude: shelter.latitude,
                            facilities: shelter.facilities ? JSON.stringify(shelter.facilities) : '',
                            contact_info: shelter.contact_info ? JSON.stringify(shelter.contact_info) : '',
                            operating_hours: shelter.operating_hours ? JSON.stringify(shelter.operating_hours) : '',
                            special_requirements: shelter.special_requirements,
                            created_at: shelter.created_at ? new Date(shelter.created_at).toLocaleString('zh-CN') : '',
                            updated_at: shelter.updated_at ? new Date(shelter.updated_at).toLocaleString('zh-CN') : ''
                        });
                    });
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename=shelters_${new Date().toISOString().split('T')[0]}.xlsx`);
                    await workbook.xlsx.write(res);
                    res.end();
                }
            }
            catch (error) {
                console.error('导出避难场所数据失败:', error);
                this.serverError(res, '导出数据失败');
            }
        });
        this.getCapacityHistory = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { start_date, end_date, limit = 30 } = req.query;
            if (!id) {
                this.error(res, '避难场所ID不能为空', 400);
                return;
            }
            const shelter = await this.shelterModel.findById(parseInt(id));
            if (!shelter) {
                this.notFound(res, '避难场所不存在');
                return;
            }
            try {
                let sql = `
        SELECT 
          TO_CHAR(soh.created_at, 'YYYY-MM-DD') AS date,
          soh.new_occupancy AS occupancy,
          soh.change_amount AS change,
          COALESCE(soh.change_reason, '系统更新') AS reason,
          soh.created_at AS timestamp
        FROM shelters_occupancy_history soh
        WHERE soh.shelter_id = $1
      `;
                const params = [parseInt(id)];
                let paramIdx = 2;
                if (start_date) {
                    sql += ` AND soh.created_at >= $${paramIdx++}`;
                    params.push(start_date);
                }
                if (end_date) {
                    sql += ` AND soh.created_at <= $${paramIdx++}`;
                    params.push(end_date);
                }
                sql += `
        ORDER BY soh.created_at DESC
        LIMIT $${paramIdx}
      `;
                params.push(Number(limit) || 30);
                const result = await this.shelterModel.rawQuery(sql, params);
                const historyData = result.rows.map((row) => ({
                    date: row.date,
                    occupancy: Number(row.occupancy) || 0,
                    change: Number(row.change) || 0,
                    reason: row.reason,
                    timestamp: row.timestamp
                }));
                this.success(res, historyData, '获取容量历史成功');
            }
            catch (error) {
                console.error('获取容量历史失败:', error);
                this.serverError(res, '获取容量历史失败');
            }
        });
        this.updateOccupancy = this.asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { current_occupancy } = req.body;
            if (!id) {
                this.error(res, '避难场所ID不能为空', 400);
                return;
            }
            if (current_occupancy === undefined || current_occupancy < 0) {
                this.error(res, '当前占用人数不能为空且不能小于0', 400);
                return;
            }
            const shelter = await this.shelterModel.findById(parseInt(id));
            if (!shelter) {
                this.notFound(res, '避难场所不存在');
                return;
            }
            if (current_occupancy > shelter.capacity) {
                this.error(res, '当前占用人数不能超过容量', 400);
                return;
            }
            const result = await this.shelterModel.update(parseInt(id), { current_occupancy });
            this.success(res, result, '更新占用情况成功');
        });
        this.getShelterStatistics = this.asyncHandler(async (req, res) => {
            const statistics = await this.shelterModel.getStatistics();
            this.success(res, statistics, '获取避难场所统计信息成功');
        });
        this.getShelterTypes = this.asyncHandler(async (req, res) => {
            const types = await this.shelterModel.getShelterTypes();
            this.success(res, types, '获取避难场所类型成功');
        });
        this.shelterModel = new ShelterModel_1.ShelterModel();
    }
    calculateDistance(point1, point2) {
        const R = 6371000;
        const lat1 = point1.coordinates[1] * Math.PI / 180;
        const lat2 = point2.coordinates[1] * Math.PI / 180;
        const deltaLat = (point2.coordinates[1] - point1.coordinates[1]) * Math.PI / 180;
        const deltaLng = (point2.coordinates[0] - point1.coordinates[0]) * Math.PI / 180;
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
exports.ShelterController = ShelterController;
//# sourceMappingURL=ShelterController.js.map