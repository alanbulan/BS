import { BaseModel } from './BaseModel'

export interface MonitoringStationType {
  id: number
  code: string
  name_zh: string
  name_en: string
  description_zh?: string | null
  description_en?: string | null
  is_active: boolean
  sort_order: number
  created_at: Date
  updated_at: Date
}

export interface CreateMonitoringStationTypeData {
  code: string
  name_zh: string
  name_en: string
  description_zh?: string | null
  description_en?: string | null
  is_active?: boolean
  sort_order?: number
}

export interface UpdateMonitoringStationTypeData {
  code?: string
  name_zh?: string
  name_en?: string
  description_zh?: string | null
  description_en?: string | null
  is_active?: boolean
  sort_order?: number
}

export class MonitoringStationTypeModel extends BaseModel {
  constructor() {
    super('monitoring_station_types')
  }

  async getActiveTypes(): Promise<MonitoringStationType[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY sort_order ASC, id ASC`
    const result = await this.executeQuery(sql, [])
    return result.rows as MonitoringStationType[]
  }

  async findByCode(code: string): Promise<MonitoringStationType | null> {
    const rows = await this.findWhere({ code })
    return (rows[0] as MonitoringStationType) ?? null
  }

  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    if (excludeId) {
      const sql = `SELECT 1 FROM ${this.tableName} WHERE code = $1 AND id <> $2 LIMIT 1`
      const result = await this.executeQuery(sql, [code, excludeId])
      return result.rows.length > 0
    }
    const rows = await this.findWhere({ code })
    return rows.length > 0
  }

  async create(data: CreateMonitoringStationTypeData): Promise<MonitoringStationType> {
    const payload = {
      code: data.code,
      name_zh: data.name_zh,
      name_en: data.name_en,
      description_zh: data.description_zh ?? null,
      description_en: data.description_en ?? null,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 0,
    }
    const created = await super.create(payload)
    return created as MonitoringStationType
  }

  async update(id: number, data: UpdateMonitoringStationTypeData): Promise<MonitoringStationType | null> {
    const cleaned: Record<string, any> = {}
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) cleaned[k] = v
    })
    const updated = await super.update(id, cleaned)
    return (updated as MonitoringStationType) ?? null
  }

  async delete(id: number): Promise<boolean> {
    return super.delete(id)
  }

  async validateStationType(code: string): Promise<boolean> {
    const type = await this.findByCode(code)
    return !!type && !!type.is_active
  }

  async getTypeUsageStats(): Promise<{ code: string; name_zh: string; name_en: string; station_count: number }[]> {
    const sql = `
      SELECT t.code, t.name_zh, t.name_en, COUNT(s.id) AS station_count
      FROM ${this.tableName} t
      LEFT JOIN monitoring_stations s ON s.station_type = t.code
      GROUP BY t.code, t.name_zh, t.name_en
      ORDER BY t.sort_order ASC, t.code ASC
    `
    const result = await this.executeQuery(sql, [])
    return result.rows as { code: string; name_zh: string; name_en: string; station_count: number }[]
  }
}