import api from './client';

export type PublicConfigItem = {
  config_key: string;
  config_value: any;
  description?: string | null;
  category?: string | null;
};

export async function getPublicConfigs() {
  try {
    const res = await api.get<PublicConfigItem[] | any>('/system-config', { params: { is_public: true } });
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  } catch {
    return [];
  }
}