import api from './client';

// DTO 与类型
export type EscapeRoute = {
  id: number;
  route_id?: string;
  start_point?: { type: 'Point'; coordinates: [number, number] } | null;
  end_point?: { type: 'Point'; coordinates: [number, number] } | null;
  route_geometry?: { type: 'LineString'; coordinates: [number, number][] } | null;
  distance_meters?: number | null;
  estimated_time_minutes?: number | null;
  difficulty_level?: number | null; // 1-5
  elevation_gain?: number | null;
  safety_score?: number | null; // 0-10
  route_conditions?: any | null;
  waypoints?: any | null;
  alternative_routes?: any | null;
  weather_dependency?: any | null;
  accessibility_info?: any | null;
  verification_status?: string | null; // pending/verified/rejected
  created_at?: string;
  updated_at?: string;
};

export type ListRoutesParams = {
  difficulty_min?: number;
  difficulty_max?: number;
  min_safety?: number;
  max_time?: number;
  q?: string;
};

export async function listEscapeRoutes(params: ListRoutesParams & { lng?: number; lat?: number; radius_m?: number } = {}) {
  // 使用逃生路线API：根据起点获取推荐路线
  const qp: any = {};
  if (typeof params.lng === 'number') qp.lng = params.lng;
  if (typeof params.lat === 'number') qp.lat = params.lat;
  if (typeof params.radius_m === 'number') qp.radius = params.radius_m; // 后端使用 radius 参数
  // 其他筛选条件可附带
  if (typeof params.q === 'string') qp.q = params.q;
  if (typeof params.max_time === 'number') qp.max_time = params.max_time;
  if (typeof params.min_safety === 'number') qp.min_safety = params.min_safety;
  if (typeof params.difficulty_min === 'number') qp.difficulty_min = params.difficulty_min;
  if (typeof params.difficulty_max === 'number') qp.difficulty_max = params.difficulty_max;

  // 若缺少经纬度，直接返回空数组，由调用方给出提示
  if (qp.lng === undefined || qp.lat === undefined) return [];

  // 使用后端的 escape-routes/from-point 端点
  const res = await api.get<any>('/escape-routes/from-point', { params: qp });
  const data = res?.data;
  // 规范成数组
  if (Array.isArray(data)) return data as EscapeRoute[];
  if (data && Array.isArray(data.items)) return data.items as EscapeRoute[];
  if (data && Array.isArray(data.data)) return data.data as EscapeRoute[];
  if (data && Array.isArray(data.results)) return data.results as EscapeRoute[];
  // 若返回单个对象，包装成数组
  if (data && typeof data === 'object') return [data as EscapeRoute];
  return [];
}

export async function getEscapeRoute(id: number) {
  const res = await api.get<{ success: boolean; data: EscapeRoute }>(`/escape-routes/${id}`);
  return res.data.data;
}

/**
 * 实时计算逃生路径（使用A*算法）
 * POST /routes/calculate
 */
export type CalculateRouteParams = {
  startLng: number;
  startLat: number;
  endLng?: number;
  endLat?: number;
  routeType?: 'fastest' | 'safest' | 'shortest';
  avoidHighRiskZones?: boolean;
  maxDistance?: number; // 公里
  transportMode?: 'walking' | 'driving' | 'cycling';
};

export type RouteCalculationResult = {
  route: EscapeRoute;
  alternativeRoutes?: EscapeRoute[];
  warnings?: string[];
  estimatedTime: number;
  totalDistance: number;
  safetyScore: number;
};

export async function calculateRoute(params: CalculateRouteParams): Promise<RouteCalculationResult> {
  try {
    // 构建GeoJSON Point格式
    const requestBody = {
      startPoint: {
        type: 'Point',
        coordinates: [params.startLng, params.startLat]
      },
      endPoint: params.endLng && params.endLat ? {
        type: 'Point',
        coordinates: [params.endLng, params.endLat]
      } : undefined,
      routeType: params.routeType || 'safest',
      avoidHighRiskZones: params.avoidHighRiskZones !== false,
      maxDistance: params.maxDistance || 50,
      transportMode: params.transportMode || 'walking'
    };

    console.log('计算路径请求:', requestBody);

    const res = await api.post<{ success: boolean; data: RouteCalculationResult }>('/routes/calculate', requestBody);
    
    console.log('路径计算成功:', {
      distance: res.data.data.totalDistance,
      time: res.data.data.estimatedTime,
      safetyScore: res.data.data.safetyScore,
      algorithm: res.data.data.route.route_conditions?.algorithm
    });
    
    return res.data.data;
  } catch (error: any) {
    console.error('路径计算失败:', {
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
}