import { request } from '../index';
import type { ApiResponse } from '../../types';

// 路径计算接口
export interface Point {
  type: 'Point';
  coordinates: [number, number];
}

export interface RouteOptions {
  endPoint?: Point;
  avoidHighRiskZones?: boolean;
  maxDistance?: number;
  routeType?: 'fastest' | 'safest' | 'shortest';
  transportMode?: 'walking' | 'driving' | 'cycling';
}

export interface CalculateRouteRequest {
  startPoint: Point;
  endPoint?: Point;
  avoidHighRiskZones?: boolean;
  maxDistance?: number;
  routeType?: 'fastest' | 'safest' | 'shortest';
  transportMode?: 'walking' | 'driving' | 'cycling';
}

export interface RouteResult {
  route: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
  instructions: string[];
  waypoints: Point[];
  riskLevel: number;
  alternativeRoutes?: RouteResult[];
}

export interface RouteStatus {
  routeId: string;
  status: 'active' | 'blocked' | 'rerouting';
  blockageReason?: string;
  alternativeAvailable: boolean;
}

export interface ReroutingCheck {
  needsRerouting: boolean;
  reason?: string;
  newRoute?: RouteResult;
}

export interface NearestSheltersRequest {
  location: Point;
  maxDistance?: number;
  maxResults?: number;
  shelterType?: string;
}

export interface ShelterWithDistance {
  id: number;
  name: string;
  location: Point;
  address: string;
  capacity: number;
  current_occupancy: number;
  shelter_type: string;
  distance: number;
  route?: RouteResult;
}

export interface RouteDetails {
  routeId: string;
  startPoint: Point;
  endPoint: Point;
  route: RouteResult;
  status: string;
  createdAt: string;
  lastUpdated: string;
}

// 路径计算API
export const routesApi = {
  // 计算逃生路径
  calculateRoute: (data: CalculateRouteRequest): Promise<ApiResponse<RouteResult>> => {
    return request.post('/routes/calculate', data);
  },

  // 更新路径状态
  updateRouteStatus: (routeId: string, status: string, blockageReason?: string): Promise<ApiResponse<RouteStatus>> => {
    return request.put(`/routes/${routeId}/status`, { status, blockageReason });
  },

  // 检查是否需要重新路由
  checkRerouting: (routeId: string, currentLocation: Point): Promise<ApiResponse<ReroutingCheck>> => {
    return request.post(`/routes/${routeId}/check-rerouting`, { currentLocation });
  },

  // 获取最近的避难场所
  getNearestShelters: (data: NearestSheltersRequest): Promise<ApiResponse<ShelterWithDistance[]>> => {
    return request.post('/routes/nearest-shelters', data);
  },

  // 获取路径详情
  getRouteDetails: (routeId: string): Promise<ApiResponse<RouteDetails>> => {
    return request.get(`/routes/${routeId}`);
  }
};