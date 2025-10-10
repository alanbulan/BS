import api from './client';

// 完整的风险区域类型定义（匹配数据库表结构）
export type RiskZone = {
  id: number;
  name: string;
  code?: string;
  geometry?: any;
  disaster_type_id?: number;
  base_risk_level?: number;
  population_density?: number;
  elevation_avg?: number;
  elevation_max?: number;
  elevation_min?: number;
  slope_avg?: number;
  slope_max?: number;
  geological_structure?: any;
  land_use_type?: string;
  vegetation_coverage?: number;
  administrative_level?: string;
  responsible_department?: string;
  emergency_contact?: any;
  is_monitored?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ListRiskZonesParams = {
  name?: string;
  min_risk?: number;
  max_risk?: number;
  is_monitored?: boolean;
  page?: number;
  limit?: number;
};

/**
 * 获取风险区域列表
 * GET /risk-zones
 */
export async function listRiskZones(params: ListRiskZonesParams = {}): Promise<RiskZone[]> {
  const res = await api.get<any>('/risk-zones', { params });
  const data = res?.data;
  if (Array.isArray(data)) return data as RiskZone[];
  if (data && Array.isArray(data.items)) return data.items as RiskZone[];
  if (data && Array.isArray(data.data)) return data.data as RiskZone[];
  if (data && Array.isArray(data.results)) return data.results as RiskZone[];
  return [];
}

/**
 * 检查指定位置是否在风险区域内
 * GET /risk-zones/location?longitude=xxx&latitude=xxx
 */
export async function checkLocationInRiskZone(lng: number, lat: number): Promise<{
  inRiskZone: boolean;
  riskZones?: RiskZone[];
  highestRiskLevel?: number;
}> {
  try {
    const res = await api.get<{ success: boolean; data: RiskZone[] }>('/risk-zones/location', {
      params: { longitude: lng, latitude: lat }
    });
    
    const riskZones = res.data.data || [];
    const inRiskZone = riskZones.length > 0;
    const highestRiskLevel = inRiskZone 
      ? Math.max(...riskZones.map(z => z.base_risk_level || 0))
      : 0;
    
    return {
      inRiskZone,
      riskZones,
      highestRiskLevel
    };
  } catch (error) {
    console.error('检查风险区域失败:', error);
    return { inRiskZone: false, riskZones: [] };
  }
}

/**
 * 获取风险区域详情
 * GET /risk-zones/:id
 */
export async function getRiskZone(id: number): Promise<RiskZone> {
  const res = await api.get<{ success: boolean; data: RiskZone }>(`/risk-zones/${id}`);
  return res.data.data;
}

// 默认导出
export default {
  listRiskZones,
  checkLocationInRiskZone,
  getRiskZone
};
