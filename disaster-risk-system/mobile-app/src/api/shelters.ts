import api from './client';

export type Shelter = {
  id: number;
  name: string;
  location?: any | null; // Point
  address?: string | null;
  capacity: number;
  current_occupancy?: number | null;
  shelter_type?: string | null;
  elevation?: number | null;
  safety_level?: number | null; // 1-5
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export async function listShelters(params: { is_active?: boolean; q?: string } = {}) {
  const res = await api.get<{ success: boolean; data: Shelter[]; pagination?: any }>('/shelters', { params });
  return res.data.data || [];
}

export async function getShelter(id: number) {
  const res = await api.get<{ success: boolean; data: Shelter }>(`/shelters/${id}`);
  return res.data.data;
}

/**
 * 获取附近的避难所
 * GET /shelters/nearest?latitude=xxx&longitude=xxx&radius=xxx
 * @param latitude 纬度
 * @param longitude 经度
 * @param radius 搜索半径（米），默认10000米（10公里）
 */
export async function getNearbyShelters(latitude: number, longitude: number, radius: number = 10000) {
  const res = await api.get<{ success: boolean; data: Shelter[] }>('/shelters/nearest', {
    params: { latitude, longitude, radius }
  });
  return res.data.data || [];
}

/**
 * 获取活跃避难所
 * GET /shelters?is_active=true
 */
export async function getActiveShelters() {
  const res = await api.get<{ success: boolean; data: Shelter[] }>('/shelters', {
    params: { is_active: true }
  });
  return res.data.data || [];
}