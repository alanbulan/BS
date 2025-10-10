import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ShelterModel } from '../models/ShelterModel';
import { Point, Shelter, LocationQuery } from '../types';
import * as ExcelJS from 'exceljs';

export class ShelterController extends BaseController {
  private shelterModel: ShelterModel;

  constructor() {
    super();
    this.shelterModel = new ShelterModel();
  }

  /**
   * 获取避难场所列表
   */
  getShelters = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    const { sortBy, sortOrder } = this.getSortParams(req);
    
    const {
      shelter_type,
      is_active,
      min_capacity,
      max_capacity,
      search
    } = req.query;

    // 构建查询条件
    const conditions: any = {};
    if (shelter_type) conditions.shelter_type = shelter_type;
    if (is_active !== undefined) conditions.is_active = is_active === 'true';
    if (min_capacity) conditions.min_capacity = parseInt(min_capacity as string);
    if (max_capacity) conditions.max_capacity = parseInt(max_capacity as string);
    if (search) conditions.search = search as string;

    const result = await this.shelterModel.findWithPagination({
      conditions,
      pagination: { page, limit, offset },
      sort: { field: sortBy, order: sortOrder as 'ASC' | 'DESC' }
    });

    // 处理返回数据，解析 JSON 字段并添加状态映射
    const processedData = result.data.map((shelter: any) => {
      // 解析 contact_info JSON 字段（兼容不同历史键名）
      let contact_person = '';
      let contact_phone = '';
      let management_agency = '';

      if (shelter.contact_info) {
        try {
          const contactInfo = typeof shelter.contact_info === 'string'
            ? JSON.parse(shelter.contact_info)
            : shelter.contact_info;
          // 兼容多种历史键名
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
        } catch (e) {
          console.warn('解析 contact_info 失败:', e);
        }
      }

      // 根据 is_active 和占用情况/维护状态确定状态
      let status = 'unavailable';
      if (shelter.is_active) {
        if (
          typeof shelter.current_occupancy === 'number' &&
          typeof shelter.capacity === 'number' &&
          shelter.current_occupancy >= shelter.capacity
        ) {
          status = 'full';
        } else if (shelter.maintenance_status === 'maintenance') {
          status = 'maintenance';
        } else {
          status = 'available';
        }
      }

      return {
        // 兼容前端展示与批量操作所需的 shelter_id 字段
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

  /**
   * 根据位置获取最近的避难场所
   */
  getNearestShelters = this.asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius = 10000, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      this.error(res, '经纬度参数不能为空', 400);
      return;
    }

    const location: LocationQuery = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
      radius: parseFloat(radius as string)
    };

    console.log('查询最近避难所:', { location, limit });

    try {
      const shelters = await this.shelterModel.findNearest(location, parseInt(limit as string));
      
      console.log(`找到 ${shelters.length} 个避难所`);

      // 距离已经在SQL中计算，直接返回
      this.success(res, shelters, '获取最近避难场所成功');
    } catch (error) {
      console.error('查询避难所失败:', error);
      throw error;
    }
  });

  /**
   * 获取避难场所详情
   */
  getShelterById = this.asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 创建避难场所
   */
  createShelter = this.asyncHandler(async (req: Request, res: Response) => {
    const requiredFields = ['name', 'capacity'];
    const validation = this.validateRequired(req.body, requiredFields);
    if (validation) {
      this.error(res, validation, 400);
      return;
    }

    const {
      name,
      location,
      address,
      capacity,
      current_occupancy = 0,
      shelter_type,
      facilities,
      contact_info,
      access_routes,
      elevation,
      safety_level,
      operating_hours,
      special_requirements,
      is_active
    } = req.body;

    // 验证容量
    if (capacity <= 0) {
      this.error(res, '容量必须大于0', 400);
      return;
    }

    if (current_occupancy < 0 || current_occupancy > capacity) {
      this.error(res, '当前占用人数不能小于0或大于容量', 400);
      return;
    }

    const shelterData: Omit<Shelter, 'id' | 'created_at' | 'updated_at'> = {
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

  /**
   * 更新避难场所
   */
  updateShelter = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      this.error(res, '避难场所ID不能为空', 400);
      return;
    }

    // 移除不允许更新的字段
    delete updateData.id;
    delete updateData.created_at;

    // 验证容量相关字段
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

  /**
   * 删除避难场所
   */
  deleteShelter = this.asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * 批量删除避难场所
   */
  batchDelete = this.asyncHandler(async (req: Request, res: Response) => {
    const { shelter_ids } = req.body;

    if (!shelter_ids || !Array.isArray(shelter_ids) || shelter_ids.length === 0) {
      this.error(res, '避难场所ID列表不能为空', 400);
      return;
    }

    // 验证所有ID都是有效数字
    const invalidIds = shelter_ids.filter(id => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      this.error(res, '包含无效的避难场所ID', 400);
      return;
    }

    try {
      // 检查要删除的避难场所是否存在
      const existingShelters = await this.shelterModel.findWhere({
        field: 'id',
        operator: 'IN',
        value: shelter_ids
      });

      if (existingShelters.length !== shelter_ids.length) {
        const existingIds = existingShelters.map((s: any) => s.id);
        const notFoundIds = shelter_ids.filter(id => !existingIds.includes(id));
        this.error(res, `以下避难场所不存在: ${notFoundIds.join(', ')}`, 400);
        return;
      }

      // 执行批量删除
      const sql = `DELETE FROM shelters WHERE id = ANY($1)`;
      await this.shelterModel.rawQuery(sql, [shelter_ids]);

      this.success(res, { deleted_count: shelter_ids.length }, '批量删除避难场所成功');
    } catch (error) {
      console.error('批量删除避难场所失败:', error);
      this.serverError(res, '批量删除避难场所失败');
    }
  });

  /**
   * 批量更新避难场所状态
   */
  batchUpdateStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { shelter_ids, is_active } = req.body;

    if (!shelter_ids || !Array.isArray(shelter_ids) || shelter_ids.length === 0) {
      this.error(res, '避难场所ID列表不能为空', 400);
      return;
    }

    if (typeof is_active !== 'boolean') {
      this.error(res, '状态值必须为布尔类型', 400);
      return;
    }

    // 验证所有ID都是有效数字
    const invalidIds = shelter_ids.filter(id => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      this.error(res, '包含无效的避难场所ID', 400);
      return;
    }

    try {
      // 检查要更新的避难场所是否存在
      const existingShelters = await this.shelterModel.findWhere({
        field: 'id',
        operator: 'IN',
        value: shelter_ids
      });

      if (existingShelters.length !== shelter_ids.length) {
        const existingIds = existingShelters.map((s: any) => s.id);
        const notFoundIds = shelter_ids.filter(id => !existingIds.includes(id));
        this.error(res, `以下避难场所不存在: ${notFoundIds.join(', ')}`, 400);
        return;
      }

      // 执行批量状态更新
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
    } catch (error) {
      console.error('批量更新避难场所状态失败:', error);
      this.serverError(res, '批量更新避难场所状态失败');
    }
  });

  /**
   * 导出避难场所数据
   */
  exportShelters = this.asyncHandler(async (req: Request, res: Response) => {
    const { format = 'excel' } = req.query;
    
    try {
      // 获取所有避难场所数据
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
        // CSV导出
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
        res.send('\ufeff' + csvContent); // 添加BOM以支持中文
      } else {
        // Excel导出
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('避难场所数据');

        // 设置列标题
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

        // 设置标题行样式
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF366092' }
        };

        // 添加数据行
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

        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=shelters_${new Date().toISOString().split('T')[0]}.xlsx`);

        // 写入响应
        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error('导出避难场所数据失败:', error);
      this.serverError(res, '导出数据失败');
    }
  });

  /**
   * 获取避难场所容量历史
   */
  getCapacityHistory = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { start_date, end_date, limit = 30 } = req.query;

    if (!id) {
      this.error(res, '避难场所ID不能为空', 400);
      return;
    }

    // 检查避难场所是否存在
    const shelter = await this.shelterModel.findById(parseInt(id));
    if (!shelter) {
      this.notFound(res, '避难场所不存在');
      return;
    }

    try {
      // 构建查询历史表的 SQL
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

      const params: any[] = [parseInt(id)];
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
      const historyData = result.rows.map((row: any) => ({
        date: row.date,
        occupancy: Number(row.occupancy) || 0,
        change: Number(row.change) || 0,
        reason: row.reason,
        timestamp: row.timestamp
      }));

      this.success(res, historyData, '获取容量历史成功');
    } catch (error) {
      console.error('获取容量历史失败:', error);
      this.serverError(res, '获取容量历史失败');
    }
  });

  /**
   * 更新避难场所占用情况
   */
  updateOccupancy = this.asyncHandler(async (req: Request, res: Response) => {
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

    // 检查避难场所是否存在并获取容量
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

  /**
   * 获取避难场所统计信息
   */
  getShelterStatistics = this.asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.shelterModel.getStatistics();
    this.success(res, statistics, '获取避难场所统计信息成功');
  });

  /**
   * 获取避难场所类型列表
   */
  getShelterTypes = this.asyncHandler(async (req: Request, res: Response) => {
    const types = await this.shelterModel.getShelterTypes();
    this.success(res, types, '获取避难场所类型成功');
  });

  /**
   * 计算两点间距离（米）
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const R = 6371000; // 地球半径（米）
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