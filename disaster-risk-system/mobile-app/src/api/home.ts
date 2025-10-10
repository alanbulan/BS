import client from './client';

export type HomeSummary = {
  warnings_count: number;
  active_risk_zones: number;
  shelters_available: number;
  recommended_routes: number;
};

export async function getHomeSummary(): Promise<HomeSummary> {
  const res = await client.get('/home/summary');
  return res.data ?? { warnings_count: 0, active_risk_zones: 0, shelters_available: 0, recommended_routes: 0 };
}