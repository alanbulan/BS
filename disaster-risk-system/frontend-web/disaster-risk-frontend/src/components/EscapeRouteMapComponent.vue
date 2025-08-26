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
 * 此外，叠加天气依赖(weather_dependency)与无障碍信息(accessibility_info)图层，
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
let routeLayer: L.GeoJSON | null = null
let startMarker: L.Marker | null = null
let endMarker: L.Marker | null = null
let waypointsLayer: L.GeoJSON | null = null
let alternativesLayer: L.GeoJSON | null = null
let weatherLayer: L.GeoJSON | null = null
let accessibilityLayer: L.GeoJSON | null = null
let layersControl: L.Control.Layers | null = null
let legendControl: any = null
let resizeObserver: ResizeObserver | null = null

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
  if (data.type && typeof data.type === 'string' && data.coordinates) {
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: data }] }
  }
  // Feature 数组
  if (Array.isArray(data) && data.length && data[0]?.type) {
    return { type: 'FeatureCollection', features: data }
  }
  return null
}

/**
 * 渲染整条路线（线、点、路径点、备选路线）和扩展图层（天气、无障碍）
 */
const renderAll = () => {
  if (!map) return

  clearLayers()

  const route = props.routeData
  if (!route) return

  // 解析主路线
  const routeGeo = parseMaybeJson(route.route_geometry)
  if (routeGeo && routeGeo.type === 'LineString') {
    routeLayer = L.geoJSON(routeGeo, {
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
    waypointsLayer = L.geoJSON(wps, {
      pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { radius: 5, color: '#52c41a' })
    }).addTo(map)
  }

  // 备选路线
  const alts = parseMaybeJson(route.alternative_routes)
  if (alts) {
    alternativesLayer = L.geoJSON(alts, {
      style: { color: '#faad14', weight: 3, dashArray: '6,6' }
    }).addTo(map)
  }

  // 天气依赖图层
  renderWeatherLayer(route.weather_dependency)
  // 无障碍信息图层
  renderAccessibilityLayer(route.accessibility_info)

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
 */
function renderWeatherLayer(input: any) {
  if (!map) return
  const fc = toFeatureCollection(input)
  if (!fc) return

  weatherLayer = L.geoJSON(fc as any, {
    style: getWeatherStyle,
    pointToLayer: (feature, latlng) => {
      const style = getWeatherStyle(feature)
      return L.circleMarker(latlng, { radius: 6, color: style.color as string, fillColor: style.fillColor as string, fillOpacity: 0.7, weight: 2 })
    },
    onEachFeature: (feature, layer) => bindPropertiesPopup(feature, layer, '天气依赖')
  }).addTo(map)
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
 */
function renderAccessibilityLayer(input: any) {
  if (!map) return
  const fc = toFeatureCollection(input)
  if (!fc) return

  accessibilityLayer = L.geoJSON(fc as any, {
    style: getAccessibilityStyle,
    pointToLayer: (feature, latlng) => {
      const style = getAccessibilityStyle(feature)
      return L.circleMarker(latlng, { radius: 7, color: style.color as string, fillColor: style.fillColor as string, fillOpacity: 0.8, weight: 2 })
    },
    onEachFeature: (feature, layer) => bindPropertiesPopup(feature, layer, '无障碍信息')
  }).addTo(map)
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

  layersControl = L.control.layers({}, overlays, { collapsed: true, position: 'topright' })
  layersControl.addTo(map)
}

/**
 * 刷新图例控件（根据当前两类图层存在性显示）
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
  if (!html) return
  div.innerHTML = html

  // 使用 L.Control.extend 创建自定义控件，避免直接调用 L.control() 的类型问题
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
  const layers: L.Layer[] = []
  if (routeLayer) layers.push(routeLayer)
  if (waypointsLayer) layers.push(waypointsLayer)
  if (alternativesLayer) layers.push(alternativesLayer)
  if (startMarker) layers.push(startMarker)
  if (endMarker) layers.push(endMarker)
  if (weatherLayer) layers.push(weatherLayer)
  if (accessibilityLayer) layers.push(accessibilityLayer)

  if (!layers.length) return
  const group = L.featureGroup(layers)
  const bounds = group.getBounds()
  if (bounds.isValid()) {
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
  color: #f5222d;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
}

.legend-control {
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 12px;
  color: #333;
}
.legend-control .legend-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.legend-control .legend-item {
  display: flex;
  align-items: center;
  margin: 3px 0;
}
.legend-control .legend-item .color {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  border-radius: 2px;
}
.legend-control .legend-section + .legend-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

/* 弹窗表格样式 */
:deep(.leaflet-popup-content) .popup-table {
  border-collapse: collapse;
  width: 100%;
}
:deep(.leaflet-popup-content) .popup-table td {
  border-bottom: 1px solid #eee;
  padding: 4px 6px;
  vertical-align: top;
}
</style>