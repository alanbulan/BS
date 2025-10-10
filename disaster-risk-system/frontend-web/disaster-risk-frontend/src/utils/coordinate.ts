/**
 * 坐标处理工具函数
 * 统一处理后端返回的各种坐标格式（PostGIS WKT、EWKB、GeoJSON、经纬度字段等）
 */

export interface Coordinates {
  longitude: number
  latitude: number
}

/**
 * 验证坐标是否有效
 * @param lng 经度
 * @param lat 纬度
 * @returns 是否有效
 */
export function isValidCoordinate(lng: number, lat: number): boolean {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  )
}

/**
 * 从对象中提取经纬度
 * 支持多种格式：
 * 1. 对象已有 longitude/latitude 字段（后端已解析）
 * 2. GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
 * 3. WKT格式: "POINT(lng lat)"
 * 4. EWKT格式: "SRID=4326;POINT(lng lat)"
 * 5. PostGIS EWKB十六进制（仅作兜底）
 * 
 * @param data 包含坐标数据的对象或字符串
 * @returns 经纬度对象，失败返回null
 */
export function extractCoordinates(data: any): Coordinates | null {
  if (!data) return null

  // 优先：后端已解析的经纬度字段
  if (typeof data.longitude === 'number' && typeof data.latitude === 'number') {
    const lng = data.longitude
    const lat = data.latitude
    if (isValidCoordinate(lng, lat)) {
      return { longitude: lng, latitude: lat }
    }
  }

  // 处理 location 字段
  const location = data.location || data

  // 字符串格式处理
  if (typeof location === 'string') {
    const loc = location.trim()

    // WKT格式: "POINT(lng lat)" 或 "POINT Z(lng lat)"
    if (/^POINT/i.test(loc)) {
      const match = /POINT\s*(?:Z)?\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(loc)
      if (match) {
        const lng = Number(match[1])
        const lat = Number(match[2])
        if (isValidCoordinate(lng, lat)) {
          return { longitude: lng, latitude: lat }
        }
      }
    }

    // EWKT格式: "SRID=4326;POINT(lng lat)"
    if (/^SRID=/i.test(loc)) {
      const afterSrid = loc.split(';', 2)[1] || ''
      const match = /POINT\s*(?:Z)?\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(afterSrid)
      if (match) {
        const lng = Number(match[1])
        const lat = Number(match[2])
        if (isValidCoordinate(lng, lat)) {
          return { longitude: lng, latitude: lat }
        }
      }
    }

    // PostGIS EWKB十六进制（兜底方案，正常不应该走到这里）
    if (/^0101000020[0-9A-Fa-f]+$/.test(loc)) {
      try {
        // EWKB格式：01(字节序) 01000020(类型+SRID标志) E6100000(SRID) + 16字节坐标
        const coordData = loc.substring(18) // 跳过前18个字符
        if (coordData.length >= 32) {
          const bytes: number[] = []
          for (let i = 0; i < 32; i += 2) {
            bytes.push(parseInt(coordData.substr(i, 2), 16))
          }
          const buffer = new Uint8Array(bytes).buffer
          const view = new DataView(buffer)
          const lng = view.getFloat64(0, true) // little-endian
          const lat = view.getFloat64(8, true)
          if (isValidCoordinate(lng, lat)) {
            return { longitude: lng, latitude: lat }
          }
        }
      } catch (e) {
        console.warn('EWKB解析失败:', e)
      }
    }

    // 尝试解析为JSON
    try {
      const parsed = JSON.parse(loc)
      return extractCoordinates(parsed)
    } catch {
      // 不是JSON，继续
    }
  }

  // 对象格式处理
  if (typeof location === 'object' && location !== null) {
    // GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
      const lng = Number(location.coordinates[0])
      const lat = Number(location.coordinates[1])
      if (isValidCoordinate(lng, lat)) {
        return { longitude: lng, latitude: lat }
      }
    }

    // {x: lng, y: lat}
    if (typeof location.x === 'number' && typeof location.y === 'number') {
      if (isValidCoordinate(location.x, location.y)) {
        return { longitude: location.x, latitude: location.y }
      }
    }

    // {lng, lat} 或 {lon, lat}
    const lng = location.lng ?? location.lon ?? location.longitude
    const lat = location.lat ?? location.latitude
    if (typeof lng === 'number' && typeof lat === 'number') {
      if (isValidCoordinate(lng, lat)) {
        return { longitude: lng, latitude: lat }
      }
    }

    // 数组格式 [lng, lat]
    if (Array.isArray(location) && location.length >= 2) {
      const lng = Number(location[0])
      const lat = Number(location[1])
      if (isValidCoordinate(lng, lat)) {
        return { longitude: lng, latitude: lat }
      }
    }
  }

  return null
}

/**
 * 格式化坐标为可读字符串
 * @param data 坐标数据（支持多种格式）
 * @param precision 小数位数，默认4位
 * @returns 格式化后的字符串，如 "116.4074, 39.9042"
 */
export function formatCoordinate(data: any, precision: number = 4): string {
  const coords = extractCoordinates(data)
  
  if (!coords) {
    return '未设置'
  }

  return `${coords.longitude.toFixed(precision)}, ${coords.latitude.toFixed(precision)}`
}

/**
 * 格式化坐标为精确字符串（6位小数）
 * @param data 坐标数据
 * @returns 格式化后的字符串
 */
export function formatCoordinatePrecise(data: any): string {
  return formatCoordinate(data, 6)
}

/**
 * 将坐标转换为GeoJSON Point格式
 * @param data 坐标数据
 * @returns GeoJSON Point对象，失败返回null
 */
export function toGeoJSONPoint(data: any): { type: 'Point'; coordinates: [number, number] } | null {
  const coords = extractCoordinates(data)
  
  if (!coords) {
    return null
  }

  return {
    type: 'Point',
    coordinates: [coords.longitude, coords.latitude]
  }
}

/**
 * 解析PostGIS WKB十六进制格式（专用函数，优先使用extractCoordinates）
 * @param wkb PostGIS EWKB十六进制字符串
 * @returns 坐标对象或null
 */
export function parsePostGISWKB(wkb: string): Coordinates | null {
  if (!wkb || typeof wkb !== 'string') return null

  try {
    // EWKB: 0101000020E6100000...
    if (wkb.startsWith('0101000020')) {
      const coordData = wkb.substring(18)
      if (coordData.length >= 32) {
        const bytes: number[] = []
        for (let i = 0; i < 32; i += 2) {
          bytes.push(parseInt(coordData.substr(i, 2), 16))
        }
        const buffer = new Uint8Array(bytes).buffer
        const view = new DataView(buffer)
        const lng = view.getFloat64(0, true)
        const lat = view.getFloat64(8, true)
        if (isValidCoordinate(lng, lat)) {
          return { longitude: lng, latitude: lat }
        }
      }
    }
    // WKB: 0101000000...
    else if (wkb.startsWith('0101000000')) {
      const coordData = wkb.substring(10)
      if (coordData.length >= 32) {
        const bytes: number[] = []
        for (let i = 0; i < 32; i += 2) {
          bytes.push(parseInt(coordData.substr(i, 2), 16))
        }
        const buffer = new Uint8Array(bytes).buffer
        const view = new DataView(buffer)
        const lng = view.getFloat64(0, true)
        const lat = view.getFloat64(8, true)
        if (isValidCoordinate(lng, lat)) {
          return { longitude: lng, latitude: lat }
        }
      }
    }
  } catch (e) {
    console.warn('PostGIS WKB解析失败:', e)
  }

  return null
}


