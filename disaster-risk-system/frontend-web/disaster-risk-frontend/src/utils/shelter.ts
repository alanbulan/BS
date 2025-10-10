/**
 * 避难所工具函数
 * 处理避难所数据的格式化和富化
 */

import { parseJsonSafe } from './json'

/**
 * 设施显示标签映射（键 -> 中文标签）
 * 数据库表: shelters.facilities JSONB
 */
export const FACILITY_LABELS: Record<string, string> = {
  food: '食品',
  water: '饮用水',
  heating: '供暖',
  power: '供电',
  medical: '医疗点',
  parking: '停车位',
  restrooms: '卫生间',
  sanitation: '清洁消杀',
  communication: '通信保障',
  air_conditioning: '空调',
  wifi: 'Wi-Fi',
  blanket: '棉被',
  shelter_tent: '帐篷'
}

/**
 * 归一化 contact_info 字段，兼容不同历史键名
 * 数据库表: shelters.contact_info JSONB
 * 可能包含的键: management_agency/agency/contact, contact_person/person, contact_phone/phone/emergency_phone
 */
export function normalizeContactInfo(raw: any) {
  const ci: Record<string, any> = parseJsonSafe(raw, {}) || {}
  const agency = ci.management_agency ?? ci.agency ?? ci.contact ?? ''
  const person = ci.contact_person ?? ci.person ?? ''
  const phone = ci.contact_phone ?? ci.phone ?? ci.emergency_phone ?? ''
  return {
    ...ci,
    management_agency: agency,
    agency,
    contact_person: person,
    person,
    contact_phone: phone,
    phone
  }
}

/**
 * 从避难所数据中提取设施标签列表
 */
export function getFacilitiesList(s: any): string[] {
  const raw: Record<string, any> = typeof s?.facilities === 'string' 
    ? parseJsonSafe(s.facilities, {}) 
    : (s?.facilities || {})
  if (!raw || typeof raw !== 'object') return []
  const labels: string[] = []
  Object.keys(raw).forEach((key) => {
    const val = raw[key]
    if (val === true || val === 'true' || (typeof val === 'number' && val > 0)) {
      labels.push(FACILITY_LABELS[key] || key)
    }
  })
  return labels
}

/**
 * 富化避难所对象: 解析 JSONB 字段并派生常用字段
 */
export function enrichShelter(s: any): any {
  if (!s || typeof s !== 'object') return s
  const contactInfo = normalizeContactInfo(s.contact_info)
  const facilities: Record<string, any> = typeof s.facilities === 'string' 
    ? parseJsonSafe(s.facilities, {}) 
    : (s.facilities || {})
  return {
    ...s,
    contact_info: contactInfo,
    management_agency: s.management_agency || contactInfo.management_agency || '',
    contact_person: s.contact_person || contactInfo.contact_person || '',
    contact_phone: s.contact_phone || contactInfo.contact_phone || '',
    facilities
  }
}

