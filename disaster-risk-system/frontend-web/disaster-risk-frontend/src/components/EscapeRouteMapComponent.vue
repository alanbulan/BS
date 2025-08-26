<template>
  <div class="escape-route-map-wrapper">
    <div ref="mapContainer" class="escape-route-map-container" :style="{ height }"></div>

    <div v-if="error" class="map-error-overlay">
      <div class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EscapeRoute } from '@/types'

/**
 * 逃生路线地图组件
 * 负责在Leaflet地图上渲染路线、起终点、路径点（如有）与备选路线（如有）
 * 此外，叠加天气依赖(weather_dependency)、无障碍信息(accessibility_info)、路线条件(route_conditions)图层，
 * 并提供图层控制与图例说明。
 */
interface Props {
  routeData?: EscapeRoute | null
  height?: string | number
  center?: [number, number]
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  routeData: null,
  height: '400px',
  center: () => [39.9042, 116.4074],
  zoom: 12
})

// 修复Leaflet默认图标
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// 状态
const mapContainer = ref<HTMLElement>()
const error = ref('')
let map: L.Map | null = null
// 统一为 L.Layer 以兼容 GeoJSON/LayerGroup/Marker
let routeLayer: L.Layer | null = null
let startMarker: L.Marker | null = null
let endMarker: L.Marker | null = null
let waypointsLayer: L.Layer | null = null
let alternativesLayer: L.Layer | null = null
let weatherLayer: L.Layer | null = null
let accessibilityLayer: L.Layer | null = null
// 新增：路线条件图层
let conditionsLayer: L.Layer | null = null
let layersControl: L.Control.Layers | null = null
let legendControl: any = null
let resizeObserver: ResizeObserver | null = null
// 存储主路线坐标（[lng,lat]）以支持中点标注与分布标注
let routeCoords: [number, number][] = []

/**
 * 初始化地图
 * - 创建底图、比例尺等基础控件
 */
const initializeMap = () => {
  if (!mapContainer.value) {
    error.value = '地图容器未找到'
    return
  }
  try {
    // 初始化前清空可能残留的错误信息
    error.value = ''

    map = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    L.control.scale({ position: 'bottomleft' }).addTo(map)

    map.whenReady(() => {
      renderAll()
      setTimeout(() => map?.invalidateSize(), 100)
    })

    if (mapContainer.value && (window as any).ResizeObserver) {
      resizeObserver = new ResizeObserver(() => setTimeout(() => map?.invalidateSize(), 100))
      resizeObserver.observe(mapContainer.value)
    }
  } catch (e) {
    console.error(e)
    error.value = '地图初始化失败'
  }
}

/**
 * 根据GeoJSON或字符串解析出对象
 * - 允许字符串JSON、对象直接传入
 */
const parseMaybeJson = (data: any): any | null => {
  if (!data) return null
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return null }
  }
  return data
}

/**
 * 将任意输入尽量转换为标准的 FeatureCollection 以便统一渲染
 * - 兼容 Feature、Geometry、Feature 数组
 */
function toFeatureCollection(input: any): GeoJSON.FeatureCollection | null {
  const data = parseMaybeJson(input)
  if (!data) return null

  // FeatureCollection 直接返回
  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
    return data as GeoJSON.FeatureCollection
  }
  // 单个 Feature
  if (data.type === 'Feature' && data.geometry) {
    return { type: 'FeatureCollection', features: [data] } as GeoJSON.FeatureCollection
  }
  // 纯 Geometry
  if (data.type && typeof data.type === 'string' && (data as any).coordinates) {
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: data }] }
  }
  // Feature 数组
  if (Array.isArray(data) && data.length && (data[0] as any)?.type) {
    return { type: 'FeatureCollection', features: data }
  }
  return null
}

/**
 * 计算主路线几何的中点坐标（优先使用 route_geometry 的坐标）
 * 返回 L.LatLng 或 null
 */
function getRouteMidLatLng(): L.LatLng | null {
  if (routeCoords && routeCoords.length) {
    const mid = routeCoords[Math.floor(routeCoords.length / 2)]
    return L.latLng(mid[1], mid[0])
  }
  // 退化到起终点均值
  if (startMarker && endMarker) {
    const a = (startMarker.getLatLng())
    const b = (endMarker.getLatLng())
    return L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2)
  }
  return null
}

/**
 * 创建用于展示键值对信息的 DivIcon 标注
 * @param latlng 定位
 * @param title 标题
 * @param entries 数组: {label,value,color}
 */
function createInfoMarker(latlng: L.LatLng, title: string, entries: Array<{ label: string, value: string, color?: string }>): L.Marker {
  const items = entries.map(e => `<div class="info-item"><span class="dot" style="background:${e.color || '#409EFF'}"></span><span class="k">${e.label}</span><span class="v">${e.value}</span></div>`).join('')
  const html = `<div class="info-card">
      <div class="info-title">${title}</div>
      ${items}
    </div>`
  return L.marker(latlng, { icon: L.divIcon({ className: 'info-card-wrapper', html }) })
}

/**
 * 渲染整条路线（线、点、路径点、备选路线）和扩展图层（天气、无障碍、路线条件）
 */
const renderAll = () => {
  if (!map) return

  clearLayers()

  const route = props.routeData
  if (!route) return

  // 解析主路线
  const routeGeo = parseMaybeJson(route.route_geometry)
  routeCoords = []
  if (routeGeo && routeGeo.type === 'LineString') {
    routeCoords = (routeGeo.coordinates || []) as [number, number][]
    routeLayer = L.geoJSON(routeGeo as any, {
      style: { color: '#1890ff', weight: 5, opacity: 0.9 }
    }).addTo(map)
  }

  // 起点终点
  const start = parseMaybeJson(route.start_point)
  const end = parseMaybeJson(route.end_point)

  if (start && start.type === 'Point' && Array.isArray(start.coordinates)) {
    startMarker = L.marker([start.coordinates[1], start.coordinates[0]]).addTo(map)
    startMarker.bindPopup('起点')
  }
  if (end && end.type === 'Point' && Array.isArray(end.coordinates)) {
    endMarker = L.marker([end.coordinates[1], end.coordinates[0]]).addTo(map)
    endMarker.bindPopup('终点')
  }

  // 路径点
  const wps = parseMaybeJson(route.waypoints)
  if (wps && (wps.type === 'FeatureCollection' || wps.type === 'MultiPoint' || wps.type === 'GeometryCollection')) {
    waypointsLayer = L.geoJSON(wps as any, {
      pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { radius: 5, color: '#52c41a' })
    }).addTo(map)
  }

  // 备选路线
  const alts = parseMaybeJson(route.alternative_routes)
  if (alts) {
    alternativesLayer = L.geoJSON(alts as any, {
      style: { color: '#faad14', weight: 3, dashArray: '6,6' }
    }).addTo(map)
  }

  // 天气依赖图层
  renderWeatherLayer(route.weather_dependency)
  // 无障碍信息图层
  renderAccessibilityLayer(route.accessibility_info)
  // 新增：路线条件图层
  renderConditionsLayer(route.route_conditions)

  // 自动适配视野
  fitBounds()
  // 刷新图层控制与图例
  refreshLayersControl()
  refreshLegend()
}

/**
 * 天气依赖图层样式：
 * - 根据 feature.properties.condition/type 等字段着色
 * - 根据 severity/level/risk_level 调整透明度与线宽
 */
function getWeatherStyle(feature?: any): L.PathOptions {
  const p = feature?.properties || {}
  const condition = (p.condition || p.type || p.weather || '').toString().toLowerCase()
  const severity = Number(p.severity ?? p.level ?? p.risk_level ?? 0)

  const colorMap: Record<string, string> = {
    rain: '#409EFF', // primary
    snow: '#A0CFFF',
    wind: '#E6A23C', // warning
    fog: '#909399',
    storm: '#F56C6C', // danger
    heat: '#F39C12'
  }
  const color = colorMap[condition] || '#8E44AD'
  const opacity = Math.min(1, 0.3 + (isFinite(severity) ? severity * 0.12 : 0))
  const weight = 2 + (isFinite(severity) ? Math.min(4, severity) : 0)

  return { color, weight, opacity, fillColor: color, fillOpacity: 0.15 + opacity * 0.35 }
}

/**
 * 渲染天气依赖图层
 * - 支持 FeatureCollection/Feature/Geometry/数组
 * - 为要素绑定属性弹窗
 * - 回退：若仅为普通对象（非GeoJSON），在主路线中点落一个信息标注
 */
function renderWeatherLayer(input: any) {
  if (!map) return
  const fc = toFeatureCollection(input)
  if (fc) {
    weatherLayer = L.geoJSON(fc as any, {
      style: getWeatherStyle,
      pointToLayer: (feature, latlng) => {
        const style = getWeatherStyle(feature)
        return L.circleMarker(latlng, { radius: 6, color: style.color as string, fillColor: style.fillColor as string, fillOpacity: 0.7, weight: 2 })
      },
      onEachFeature: (feature, layer) => bindPropertiesPopup(feature, layer, '天气依赖')
    }).addTo(map)
    return
  }
  const obj = parseMaybeJson(input)
  if (obj && typeof obj === 'object') {
    const mid = getRouteMidLatLng()
    if (mid) {
      const mapping: Record<string, string> = { rain: '降雨', snow: '降雪', wind: '大风', fog: '雾', heat: '高温' }
      const colorMap: Record<string, string> = { rain: '#409EFF', snow: '#A0CFFF', wind: '#E6A23C', fog: '#909399', heat: '#F39C12' }
      const entries = Object.keys(obj).map(k => ({ label: mapping[k] || k, value: String(obj[k]), color: colorMap[k] }))
      const marker = createInfoMarker(mid, '天气依赖', entries)
      weatherLayer = L.layerGroup([marker]).addTo(map)
    }
  }
}

/**
 * 无障碍信息图层样式
 */
function getAccessibilityStyle(feature?: any): L.PathOptions {
  const p = feature?.properties || {}
  const t = (p.type || p.category || p.access_type || '').toString().toLowerCase()
  const colorMap: Record<string, string> = {
    ramp: '#67C23A', // success
    elevator: '#409EFF',
    stairs: '#F56C6C',
    obstacle: '#E6A23C',
    barrier: '#E6A23C',
    tactile_paving: '#909399',
  }
  const color = colorMap[t] || '#2ecc71'
  const score = Number(p.accessibility_score ?? p.score ?? 0)
  const opacity = Math.min(1, 0.4 + (isFinite(score) ? score * 0.1 : 0))
  return { color, weight: 3, opacity, fillColor: color, fillOpacity: 0.2 + opacity * 0.3 }
}

/**
 * 渲染无障碍信息图层
 * - 回退：若仅为普通对象（非GeoJSON），在主路线中点落信息标注
 */
function renderAccessibilityLayer(input: any) {
  if (!map) return
  const fc = toFeatureCollection(input)
  if (fc) {
    accessibilityLayer = L.geoJSON(fc as any, {
      style: getAccessibilityStyle,
      pointToLayer: (feature, latlng) => {
        const style = getAccessibilityStyle(feature)
        return L.circleMarker(latlng, { radius: 7, color: style.color as string, fillColor: style.fillColor as string, fillOpacity: 0.8, weight: 2 })
      },
      onEachFeature: (feature, layer) => bindPropertiesPopup(feature, layer, '无障碍信息')
    }).addTo(map)
    return
  }
  const obj = parseMaybeJson(input)
  if (obj && typeof obj === 'object') {
    const mid = getRouteMidLatLng()
    if (mid) {
      // 典型键：wheelchair/elderly/children => 是/否
      const mapping: Record<string, string> = { wheelchair: '轮椅', elderly: '老人', children: '儿童' }
      const entries = Object.keys(obj).map(k => ({ label: mapping[k] || k, value: String(obj[k]) === 'true' ? '可达' : String(obj[k]) }))
      const marker = createInfoMarker(mid, '无障碍信息', entries)
      accessibilityLayer = L.layerGroup([marker]).addTo(map)
    }
  }
}

/**
 * 路线条件图层样式
 * - condition/type: blocked/damaged/flooded/landslide/ice 等
 * - severity/level：影响圆点大小、透明度
 */
function getConditionStyle(feature?: any): L.PathOptions {
  const p = feature?.properties || {}
  const t = (p.condition || p.type || p.category || '').toString().toLowerCase()
  const severity = Number(p.severity ?? p.level ?? 0)
  const colorMap: Record<string, string> = {
    blocked: '#F56C6C',
    damaged: '#E6A23C',
    flooded: '#409EFF',
    landslide: '#C0392B',
    ice: '#A0CFFF',
    construction: '#F39C12',
  }
  const color = colorMap[t] || '#9B59B6'
  const weight = 2 + (isFinite(severity) ? Math.min(4, severity) : 0)
  const opacity = Math.min(1, 0.5 + (isFinite(severity) ? severity * 0.08 : 0))
  return { color, weight, opacity, fillColor: color, fillOpacity: 0.25 + (opacity * 0.2) }
}

/**
 * 渲染路线条件图层
 * - 尽量兼容点/线/面要素；点以圆标注展示，线/面按样式着色
 * - 回退：若仅为普通对象（非GeoJSON），在主路线中点落信息标注（例如 surface/lighting/shelter/water）
 */
function renderConditionsLayer(input: any) {
  if (!map) return
  const fc = toFeatureCollection(input)
  if (fc) {
    conditionsLayer = L.geoJSON(fc as any, {
      style: getConditionStyle,
      pointToLayer: (feature, latlng) => {
        const style = getConditionStyle(feature)
        const sev = Number(feature?.properties?.severity ?? feature?.properties?.level ?? 0)
        const radius = 6 + (isFinite(sev) ? Math.min(10, sev * 2) : 0)
        return L.circleMarker(latlng, { radius, color: style.color as string, fillColor: style.fillColor as string, fillOpacity: 0.85, weight: 2 })
      },
      onEachFeature: (feature, layer) => bindPropertiesPopup(feature, layer, '路线条件')
    }).addTo(map)
    return
  }
  const obj = parseMaybeJson(input)
  if (obj && typeof obj === 'object') {
    const mid = getRouteMidLatLng()
    if (mid) {
      const mapping: Record<string, string> = { surface: '路面', lighting: '照明', shelter: '避难设施', water: '饮水' }
      const colorMap: Record<string, string> = { surface: '#409EFF', lighting: '#F39C12', shelter: '#67C23A', water: '#00B8D9' }
      const entries = Object.keys(obj).map(k => ({ label: mapping[k] || k, value: String(obj[k]), color: colorMap[k] }))
      const marker = createInfoMarker(mid, '路线条件', entries)
      conditionsLayer = L.layerGroup([marker]).addTo(map)
    }
  }
}

/**
 * 为要素绑定属性弹窗（表格方式展示）
 */
function bindPropertiesPopup(feature: any, layer: L.Layer, title: string) {
  const props = feature?.properties || {}
  const rows = Object.keys(props).map(k => `<tr><td>${k}</td><td>${escapeHtml(String(props[k]))}</td></tr>`).join('')
  const html = `
    <div style="min-width:200px;">
      <div style="font-weight:600;margin-bottom:6px;">${title}</div>
      ${rows ? `<table class="popup-table"><tbody>${rows}</tbody></table>` : '<div>无属性信息</div>'}
    </div>
  `
  ;(layer as any).bindPopup(html)
}

/**
 * 刷新图层控制
 */
function refreshLayersControl() {
  if (!map) return
  if (layersControl) {
    map.removeControl(layersControl)
    layersControl = null
  }
  const overlays: Record<string, L.Layer> = {}
  if (routeLayer) overlays['主路线'] = routeLayer
  if (waypointsLayer) overlays['路径点'] = waypointsLayer
  if (alternativesLayer) overlays['备选路线'] = alternativesLayer
  if (weatherLayer) overlays['天气依赖'] = weatherLayer
  if (accessibilityLayer) overlays['无障碍信息'] = accessibilityLayer
  // 新增：路线条件
  if (conditionsLayer) overlays['路线条件'] = conditionsLayer

  layersControl = L.control.layers({}, overlays, { collapsed: true, position: 'topright' })
  layersControl.addTo(map)
}

/**
 * 刷新图例控件（根据当前图层存在性显示）
 */
function refreshLegend() {
  if (!map) return
  if (legendControl) {
    map.removeControl(legendControl)
    legendControl = null
  }
  const div = L.DomUtil.create('div', 'legend-control')
  let html = ''
  if (weatherLayer) {
    html += `<div class="legend-section"><div class="legend-title">天气依赖</div>
      <div class="legend-item"><span class="color" style="background:#409EFF"></span>降雨</div>
      <div class="legend-item"><span class="color" style="background:#A0CFFF"></span>降雪</div>
      <div class="legend-item"><span class="color" style="background:#E6A23C"></span>大风/沙尘</div>
      <div class="legend-item"><span class="color" style="background:#F56C6C"></span>风暴/强对流</div>
    </div>`
  }
  if (accessibilityLayer) {
    html += `<div class="legend-section"><div class="legend-title">无障碍</div>
      <div class="legend-item"><span class="color" style="background:#67C23A"></span>坡道</div>
      <div class="legend-item"><span class="color" style="background:#409EFF"></span>电梯</div>
      <div class="legend-item"><span class="color" style="background:#F56C6C"></span>台阶</div>
      <div class="legend-item"><span class="color" style="background:#E6A23C"></span>障碍/围挡</div>
    </div>`
  }
  if (conditionsLayer) {
    html += `<div class="legend-section"><div class="legend-title">路线条件</div>
      <div class="legend-item"><span class="color" style="background:#F56C6C"></span>阻断</div>
      <div class="legend-item"><span class="color" style="background:#E6A23C"></span>损坏/施工</div>
      <div class="legend-item"><span class="color" style="background:#409EFF"></span>积水/洪涝</div>
      <div class="legend-item"><span class="color" style="background:#9B59B6"></span>其他</div>
    </div>`
  }
  if (!html) return
  div.innerHTML = html

  // 使用 L.Control.extend 创建自定义控件
  const LegendClass = (L.Control as any).extend({
    onAdd: function () {
      return div
    }
  })
  legendControl = new LegendClass({ position: 'bottomright' })
  legendControl.addTo(map)
}

/**
 * 转义HTML用于弹窗
 */
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 调整视野至涵盖所有要素
 */
const fitBounds = () => {
  if (!map) return
  const layers: any[] = []
  if (routeLayer) layers.push(routeLayer)
  if (waypointsLayer) layers.push(waypointsLayer)
  if (alternativesLayer) layers.push(alternativesLayer)
  if (startMarker) layers.push(startMarker)
  if (endMarker) layers.push(endMarker)
  if (weatherLayer) layers.push(weatherLayer)
  if (accessibilityLayer) layers.push(accessibilityLayer)
  if (conditionsLayer) layers.push(conditionsLayer)

  if (!layers.length) return

  // 安全地聚合边界，避免某些图层暴露了非函数的 getLatLng 属性导致异常
  const bounds = L.latLngBounds([])
  const extendFromLayer = (layer: any) => {
    try {
      if (!layer) return
      if (typeof layer.getBounds === 'function') {
        const b = layer.getBounds()
        if (b && b.isValid && b.isValid()) bounds.extend(b)
        return
      }
      if (typeof layer.getLatLngs === 'function') {
        const latlngs: any = layer.getLatLngs()
        const flat: any[] = Array.isArray(latlngs) ? latlngs.flat(Infinity) : []
        if (flat.length) bounds.extend(L.latLngBounds(flat as any))
        return
      }
      if (typeof layer.getLatLng === 'function') {
        const ll = layer.getLatLng()
        if (ll) bounds.extend(ll)
        return
      }
      if (typeof layer.eachLayer === 'function') {
        layer.eachLayer((l: any) => extendFromLayer(l))
        return
      }
    } catch (e) {
      console.warn('聚合边界时跳过异常图层', e)
    }
  }

  layers.forEach(extendFromLayer)
  if ((bounds as any)._southWest && bounds.isValid()) {
    map.fitBounds(bounds.pad(0.2))
  }
}

/**
 * 清理所有图层与控件
 */
const clearLayers = () => {
  if (!map) return
  if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null }
  if (waypointsLayer) { map.removeLayer(waypointsLayer); waypointsLayer = null }
  if (alternativesLayer) { map.removeLayer(alternativesLayer); alternativesLayer = null }
  if (startMarker) { map.removeLayer(startMarker); startMarker = null }
  if (endMarker) { map.removeLayer(endMarker); endMarker = null }
  if (weatherLayer) { map.removeLayer(weatherLayer); weatherLayer = null }
  if (accessibilityLayer) { map.removeLayer(accessibilityLayer); accessibilityLayer = null }
  if (conditionsLayer) { map.removeLayer(conditionsLayer); conditionsLayer = null }
  if (layersControl) { map.removeControl(layersControl); layersControl = null }
  if (legendControl) { map.removeControl(legendControl); legendControl = null }
}

// 监听数据变化重渲染
watch(() => props.routeData, () => {
  renderAll()
}, { deep: true })

onMounted(() => initializeMap())
onUnmounted(() => {
  clearLayers()
  if (map) { map.remove(); map = null }
  if (resizeObserver && mapContainer.value) resizeObserver.unobserve(mapContainer.value)
})
</script>

<style scoped>
.escape-route-map-wrapper {
  position: relative;
  width: 100%;
  min-height: 400px;
}

.escape-route-map-container {
  width: 100%;
  min-height: 400px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.map-error-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
}

/* 使 Leaflet 的 div 图标在无固定尺寸时自适应内容，避免文本挤压换行 */
:deep(.leaflet-div-icon) {
  background: transparent;
  border: none;
  width: auto;
  height: auto;
}

/* 信息标注样式（使用深度选择器以作用于Leaflet动态创建的DOM） */
:deep(.info-card-wrapper) { pointer-events: none; }
:deep(.info-card) {
  pointer-events: auto;
  background: rgba(255,255,255,0.95);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  font-size: 12px;
  min-width: 160px;
  white-space: nowrap;
}
:deep(.info-title) { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
:deep(.info-item) { display: flex; align-items: center; gap: 6px; margin: 4px 0; font-size: 12px; }
:deep(.info-item .dot) { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
:deep(.info-item .k) { color: #606266; }
:deep(.info-item .v) { color: #303133; font-weight: 500; }

/* 图例控件样式（使用深度选择器） */
:deep(.legend-control) {
  background: rgba(255,255,255,0.95);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  font-size: 12px;
}
:deep(.legend-section) { margin-bottom: 6px; }
:deep(.legend-title) { font-weight: 600; margin-bottom: 6px; }
:deep(.legend-item) { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
:deep(.legend-item .color) { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
</style>