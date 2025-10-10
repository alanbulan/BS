import client from './client';

export type MonitoringStation = {
  id: number;
  station_id?: string;
  name: string;
  station_code?: string;
  station_type?: string;
  data_types?: string[] | null;
  // PostGIS returns coordinates as separate fields
  longitude?: number;
  latitude?: number;
  location_wkt?: string;
  // Or as GeoJSON Point [lng, lat]
  location?: { type: 'Point'; coordinates: [number, number] } | null;
  is_active?: boolean;
  zone_id?: number;
  zone_name?: string;
  base_risk_level?: number;
  equipment_info?: any;
  installation_date?: string;
  maintenance_schedule?: any;
  data_transmission_interval?: number;
  last_data_time?: string;
  data_count_24h?: number;
  created_at?: string;
  updated_at?: string;
};

export type MonitoringDataPoint = {
  id: number;
  timestamp: string;
  value: number;
  data_type: string;
  station_id: string | number;
  unit?: string;
  quality_flag?: number;
  raw_data?: any;
  processed_data?: any;
  device_status?: string;
  station_name?: string;
  station_type?: string;
};

export async function listStations(params?: { activeOnly?: boolean; limit?: number }): Promise<MonitoringStation[]> {
  const res = await client.get('/monitoring/stations', {
    params: { 
      active: params?.activeOnly ?? true,
      page: 1,
      limit: params?.limit || 1000  // 默认获取所有站点
    },
  });
  return res.data ?? [];
}

export async function listMonitoringData(params: {
  station_id?: number | string;
  data_type?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<MonitoringDataPoint[]> {
  const res = await client.get('/monitoring', { params });
  const data = res?.data;
  if (Array.isArray(data)) return data as MonitoringDataPoint[];
  if (data && Array.isArray((data as any).items)) return (data as any).items as MonitoringDataPoint[];
  if (data && Array.isArray((data as any).data)) return (data as any).data as MonitoringDataPoint[];
  if (data && Array.isArray((data as any).results)) return (data as any).results as MonitoringDataPoint[];
  return [];
}