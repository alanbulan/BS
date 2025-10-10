import api from './client';

export type Warning = {
  id: number;
  warning_id?: string;
  zone_id?: number | null;
  disaster_type_id?: number | null;
  warning_level?: number | null; // 1-5
  title: string;
  content: string;
  affected_area?: any | null; // GeoJSON/Polygon WKT 后端返回形态按实现
  estimated_affected_population?: number | null;
  issue_time: string;
  effective_time?: string | null;
  expiry_time?: string | null;
  issuing_authority?: string | null;
  contact_info?: any | null;
  recommended_actions?: any | null;
  evacuation_required?: boolean | null;
  shelter_recommendations?: any | null;
  status?: string; // active/inactive
  update_sequence?: number | null;
  parent_warning_id?: number | null;
  created_at?: string;
};

export type ListWarningsParams = {
  status?: 'active' | 'inactive';
  levelMin?: number;
  levelMax?: number;
  q?: string;
};

export async function listWarnings(params: ListWarningsParams = {}) {
  const res = await api.get<{ success: boolean; data: Warning[]; pagination?: any }>('/warnings', { params });
  return res.data.data || [];
}

export async function getWarning(id: number) {
  const res = await api.get<{ success: boolean; data: Warning }>(`/warnings/${id}`);
  return res.data.data;
}

/**
 * 获取活跃预警
 * GET /warnings/active
 */
export async function getActiveWarnings() {
  const res = await api.get<{ success: boolean; data: Warning[] }>('/warnings/active');
  return res.data.data || [];
}

/**
 * 根据位置获取附近的预警
 * GET /warnings/location?latitude=xxx&longitude=xxx&radius=xxx
 */
export async function getWarningsByLocation(latitude: number, longitude: number, radius: number = 10) {
  const res = await api.get<{ success: boolean; data: Warning[] }>('/warnings/location', {
    params: { latitude, longitude, radius }
  });
  return res.data.data || [];
}

/**
 * 根据预警等级获取预警
 * GET /warnings/level?level=xxx
 */
export async function getWarningsByLevel(level: number) {
  const res = await api.get<{ success: boolean; data: Warning[] }>('/warnings/level', {
    params: { level }
  });
  return res.data.data || [];
}