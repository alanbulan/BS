import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MonitoringStationModel } from '../models/MonitoringStationModel';
import { MonitoringStation, Point } from '../types';
import { MonitoringStationTypeModel } from '../models/MonitoringStationTypeModel';

export class MonitoringStationController extends BaseController {
  private stationModel: MonitoringStationModel;
  private typeModel: MonitoringStationTypeModel;

  constructor() {
    super();
    this.stationModel = new MonitoringStationModel();
    this.typeModel = new MonitoringStationTypeModel();
  }

  /**
   * 创建监测站点
   */
  createStation = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, [
      'station_id',
      'station_name',
      'station_type',
      'status',
      'location'
    ]);
    if (validation) return this.error(res, validation);

    const {
      station_id,
      station_name,
      station_type,
      status,
      location,
      province,
      city,
      county,
      address,
      altitude,
      installation_date,
      manager_name,
      manager_phone,
      responsible_unit,
      equipment_info,
      maintenance_cycle,
      last_maintenance_date,
      next_maintenance_date,
      remark
    } = req.body;

    // 兼容旧字段：若传入 altitude 且未提供 elevation，则映射为 elevation
    if (altitude !== undefined && req.body.elevation === undefined) {
      req.body.elevation = altitude;
    }

    // 1. station_id唯一性检查
    const existingStation = await this.stationModel.findByStationId(station_id);
    if (existingStation) {
      return this.error(res, '监测站编号已存在');
    }

    // 2. 验证 station_type 是否存在
    if (!(await this.typeModel.validateStationType(station_type))) {
      return this.error(res, '监测站类型不存在或已禁用');
    }

    // 3. location格式验证
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return this.error(res, 'location格式错误，应为 {type: "Point", coordinates: [lng, lat]}');
    }

    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return this.error(res, '经纬度范围错误');
    }

    try {
      const station = await this.stationModel.create(req.body);
      return this.created(res, station, '监测站点创建成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取监测站点列表
   */
  getStations = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    const { 
      station_type, 
      zone_id, 
      is_active = 'true',
      search 
    } = req.query;

    try {
      let conditions: any = {};
      
      if (station_type) {
        conditions.station_type = station_type;
      }
      
      if (zone_id) {
        conditions.zone_id = parseInt(zone_id as string);
      }
      
      if (is_active !== 'all') {
        conditions.is_active = is_active === 'true';
      }

      if (search) {
        conditions.search = search as string;
      }

      console.error('=== 即将调用paginate方法 ===');
      console.error('参数:', { page, limit, conditions });
      const result = await this.stationModel.paginate(page, limit, conditions);
      console.error('=== paginate方法调用完成 ===');
      
      
      const pagination = {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        };
      return this.paginated(res, result.data, pagination);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据ID获取监测站点
   */
  getStationById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    try {
      const station = await this.stationModel.findById(stationId);
      if (!station) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, station);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据站点编号获取监测站点
   */
  getStationByStationId = this.asyncHandler(async (req: Request, res: Response) => {
    const { station_id } = req.params;

    try {
      const station = await this.stationModel.findByStationId(station_id);
      if (!station) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, station);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新监测站点
   */
  updateStation = this.asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return this.error(res, '无效的监测站ID');
    }

    const {
      station_id,
      station_name,
      station_type,
      status,
      location,
      province,
      city,
      county,
      address,
      altitude,
      installation_date,
      manager_name,
      manager_phone,
      responsible_unit,
      equipment_info,
      maintenance_cycle,
      last_maintenance_date,
      next_maintenance_date,
      remark
    } = req.body;

    // 兼容旧字段：若传入 altitude 且未提供 elevation，则映射为 elevation
    if (altitude !== undefined && req.body.elevation === undefined) {
      req.body.elevation = altitude;
    }

    try {
      // 1. 检查监测站是否存在
      const existingStation = await this.stationModel.findById(id);
      if (!existingStation) {
        return this.notFound(res, '监测站不存在');
      }

      // 2. 如果更新station_id，检查新ID是否唯一
      if (station_id && station_id !== existingStation.station_id) {
        const duplicateStation = await this.stationModel.findByStationId(station_id);
        if (duplicateStation) {
          return this.error(res, '监测站编号已存在');
        }
      }

      // 3. 如果更新station_type，验证类型是否有效
      if (station_type && !(await this.typeModel.validateStationType(station_type))) {
        return this.error(res, '监测站类型不存在或已禁用');
      }

      // 4. location格式验证（如果提供）
      if (location) {
        if (!location.coordinates || location.coordinates.length !== 2) {
          return this.error(res, 'location格式错误，应为 {type: "Point", coordinates: [lng, lat]}');
        }

        const [lng, lat] = location.coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return this.error(res, '经纬度范围错误');
        }
      }

      const updatedStation = await this.stationModel.update(id, req.body);
      if (!updatedStation) {
        return this.error(res, '更新失败');
      }

      return this.success(res, updatedStation, '监测站点更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取活跃的监测站点
   */
  getActiveStations = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await this.stationModel.paginate(1, 1000, { is_active: true });
      return this.success(res, result.data);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据站点类型获取站点
   */
  getStationsByType = this.asyncHandler(async (req: Request, res: Response) => {
    const { station_type } = req.params;

    try {
      const stations = await this.stationModel.paginate(1, 1000, { station_type });
      return this.success(res, stations);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 根据风险区域获取站点
   */
  getStationsByZone = this.asyncHandler(async (req: Request, res: Response) => {
    const { zone_id } = req.params;
    const zoneId = parseInt(zone_id);

    if (isNaN(zoneId)) {
      return this.error(res, '无效的区域ID');
    }

    try {
      const stations = await this.stationModel.getStationsByZone(zoneId);
      return this.success(res, stations);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 查找附近的监测站点
   */
  getNearbyStations = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['longitude', 'latitude']);
    if (validation) {
      return this.error(res, validation);
    }

    const { longitude, latitude, radius = 10 } = req.query;
    const radiusKm = Math.min(100, Math.max(1, parseInt(radius as string) || 10));

    const location: Point = {
      type: 'Point',
      coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)]
    };

    // 验证坐标
    if (isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      return this.error(res, '坐标格式不正确');
    }

    try {
      const stations = await this.stationModel.paginate(1, 1000, {});
      return this.success(res, stations);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新站点位置
   */
  updateStationLocation = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    const validation = this.validateRequired(req.body, ['location']);
    if (validation) {
      return this.error(res, validation);
    }

    const { location } = req.body as { location: Point };

    // 验证坐标格式
    if (!location.coordinates || location.coordinates.length !== 2) {
      return this.error(res, '位置坐标格式不正确');
    }

    const [longitude, latitude] = location.coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return this.error(res, '位置坐标超出有效范围');
    }

    try {
      const updatedStation = await this.stationModel.update(stationId, { location });
      if (!updatedStation) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, updatedStation, '站点位置更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 切换站点状态
   */
  toggleStationStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    const validation = this.validateRequired(req.body, ['is_active']);
    if (validation) {
      return this.error(res, validation);
    }

    const { is_active } = req.body;

    try {
      const updatedStation = await this.stationModel.update(stationId, { is_active });
      if (!updatedStation) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, updatedStation, `监测站点${is_active ? '激活' : '停用'}成功`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取站点统计信息
   */
  getStationStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await this.stationModel.paginate(1, 1, {});
      const stats = { total: result.pagination.total };
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取站点类型统计
   */
  getStationTypeStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await this.stationModel.paginate(1, 1000, {});
      const stats = result.data;
      return this.success(res, stats);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取需要维护的站点
   */
  getStationsNeedingMaintenance = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await this.stationModel.paginate(1, 1000, {});
      const stations = result.data;
      return this.success(res, stations);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新维护计划
   */
  updateMaintenanceSchedule = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    const validation = this.validateRequired(req.body, ['maintenance_schedule']);
    if (validation) {
      return this.error(res, validation);
    }

    const { maintenance_schedule } = req.body;

    try {
      const updatedStation = await this.stationModel.update(stationId, { maintenance_schedule });
      if (!updatedStation) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, updatedStation, '维护计划更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 更新站点设备信息
   */
  updateStationEquipment = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    const validation = this.validateRequired(req.body, ['equipment_info']);
    if (validation) {
      return this.error(res, validation);
    }

    const { equipment_info } = req.body;

    try {
      const updatedStation = await this.stationModel.update(stationId, { equipment_info });
      if (!updatedStation) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, updatedStation, '设备信息更新成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取站点数据传输状态
   */
  getDataTransmissionStatus = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await this.stationModel.paginate(1, 1000, {});
      const status = result.data;
      return this.success(res, status);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 删除监测站点
   */
  deleteStation = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    try {
      const success = await this.stationModel.delete(stationId);
      if (!success) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, null, '监测站点删除成功');
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 批量更新站点状态
   */
  batchUpdateStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const validation = this.validateRequired(req.body, ['station_ids', 'is_active']);
    if (validation) {
      return this.error(res, validation);
    }

    const { station_ids, is_active } = req.body;

    if (!Array.isArray(station_ids) || station_ids.length === 0) {
      return this.error(res, '请提供有效的站点ID数组');
    }

    // 验证所有ID都是数字
    const invalidIds = station_ids.filter(id => isNaN(Number(id)));
    if (invalidIds.length > 0) {
      return this.error(res, `无效的站点ID: ${invalidIds.join(', ')}`);
    }

    try {
      let updatedCount = 0;
      for (const id of station_ids.map(id => Number(id))) {
        await this.stationModel.update(id, { is_active });
        updatedCount++;
      }
      return this.success(res, { updated_count: updatedCount }, `成功更新 ${updatedCount} 个站点状态`);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取监测站详情
   */
  getStationDetail = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return this.error(res, '无效的站点ID');
    }

    try {
      const station = await this.stationModel.findById(stationId);
      if (!station) {
        return this.notFound(res, '监测站点不存在');
      }

      return this.success(res, station);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 获取监测站统计信息
   */
  getStationStatistics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const statistics = await this.stationModel.getStationStatistics();
      return this.success(res, statistics);
    } catch (error) {
      return this.serverError(res, error);
    }
  });

  /**
   * 批量更新站点状态（路由别名）
   */
  batchUpdateStationStatus = this.batchUpdateStatus;
}