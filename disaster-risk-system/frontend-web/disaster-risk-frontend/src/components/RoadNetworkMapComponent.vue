<template>
  <div class="road-network-map-wrapper">
    <div ref="mapContainer" class="road-network-map-container" :style="{ height }"></div>
    
    <!-- 错误提示覆盖层 -->
    <div v-if="error" class="map-error-overlay">
      <div class="error-message">
        <i class="el-icon-warning"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ElMessage } from 'element-plus'
import type { RoadNetwork } from '@/types'

/**
 * 道路网络几何路线地图组件
 * 负责在Leaflet地图上渲染道路的几何形状（LineString）
 * 显示道路基本信息、长度、等级等详细信息
 */

// 修复Leaflet默认图标路径问题
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

interface Props {
  roadNetwork?: RoadNetwork | null
  center?: [number, number]
  zoom?: number
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [39.9042, 116.4074],
  zoom: 12,
  height: '400px'
})

// 响应式数据
const mapContainer = ref<HTMLElement>()
const error = ref<string>('')
let map: L.Map | null = null
let roadLayer: L.GeoJSON | null = null
let startMarker: L.Marker | null = null
let endMarker: L.Marker | null = null
let bridgeTunnelLayer: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null

// 初始化地图
const initializeMap = async () => {
  if (!mapContainer.value) {
    error.value = '地图容器未找到'
    return
  }

  try {
    // 创建地图实例
    map = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true
    })

    // 添加瓦片图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map)

    // 添加比例尺
    L.control.scale({ position: 'bottomleft' }).addTo(map)

    // 等待地图完全加载后再显示道路
    map.whenReady(() => {
      console.log('地图已准备就绪')
      if (props.roadNetwork) {
        console.log('地图准备就绪后显示道路:', props.roadNetwork)
        displayRoadNetwork(props.roadNetwork)
      }
    })

    // 设置ResizeObserver监听容器尺寸变化
    if (mapContainer.value && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (map) {
          setTimeout(() => {
            map?.invalidateSize()
          }, 100)
        }
      })
      resizeObserver.observe(mapContainer.value)
    }

    // 添加地图无效化尺寸的处理
    if (map) {
      setTimeout(() => {
        map?.invalidateSize()
      }, 100)
    }

    error.value = ''
  } catch (err) {
    console.error('地图初始化失败:', err)
    error.value = '地图初始化失败'
  }
}

// 获取道路类型颜色
const getRoadTypeColor = (roadType: string): string => {
  switch (roadType) {
    case 'highway': return '#f5222d' // 高速公路 - 红色
    case 'national': return '#fa8c16' // 国道 - 橙色
    case 'provincial': return '#faad14' // 省道 - 黄色
    case 'county': return '#52c41a' // 县道 - 绿色
    case 'rural': return '#1890ff' // 乡道 - 蓝色
    case 'urban': return '#722ed1' // 城市道路 - 紫色
    default: return '#d9d9d9' // 未知 - 灰色
  }
}

/**
 * 根据道路等级返回线宽
 * @param roadClass 道路等级，可能来自数据库为数值或字符串
 * @returns 线宽像素值
 */
const getRoadClassWidth = (roadClass: string | number): number => {
  const cls = String(roadClass)
  switch (cls) {
    case '1': return 8 // 一级道路
    case '2': return 6 // 二级道路
    case '3': return 4 // 三级道路
    case '4': return 3 // 四级道路
    default: return 4
  }
}

// 获取道路类型文本
const getRoadTypeText = (roadType: string): string => {
  switch (roadType) {
    case 'highway': return '高速公路'
    case 'national': return '国道'
    case 'provincial': return '省道'
    case 'county': return '县道'
    case 'rural': return '乡道'
    case 'urban': return '城市道路'
    default: return '未知'
  }
}

// 获取维护状态文本
const getMaintenanceStatusText = (status: string): string => {
  switch (status) {
    case 'good': return '良好'
    case 'fair': return '一般'
    case 'poor': return '较差'
    case 'maintenance': return '维护中'
    default: return '未知'
  }
}

// 解析几何数据
const parseGeometry = (geometry: any): any | null => {
  if (!geometry) return null
  
  if (typeof geometry === 'string') {
    try {
      return JSON.parse(geometry)
    } catch (e) {
      console.error('几何数据解析失败:', e)
      return null
    }
  }
  
  return geometry
}

// 显示道路网络
const displayRoadNetwork = (road: RoadNetwork) => {
  console.log('开始显示道路网络:', road.name, 'ID:', road.id)
  
  if (!map) {
    console.error('地图对象不存在')
    return
  }

  // 清除之前的图层
  clearLayers()
  
  const geometryData = parseGeometry(road.geometry)
  if (!geometryData) {
    console.error('几何数据不存在或无效')
    ElMessage.error('道路没有几何数据')
    return
  }

  try {
    console.log('几何数据:', geometryData)
    
    // 验证几何数据格式
    if (!geometryData.type || !geometryData.coordinates) {
      console.error('几何数据格式不正确:', geometryData)
      ElMessage.error('几何数据格式不正确')
      return
    }

    // 构造标准的GeoJSON对象
    const geoJsonData: GeoJSON.Feature = {
      type: 'Feature',
      geometry: geometryData,
      properties: {
        name: road.name,
        road_id: road.road_id,
        road_type: road.road_type,
        road_class: road.road_class
      }
    }
    
    console.log('构造的GeoJSON数据:', JSON.stringify(geoJsonData, null, 2))
    
    // 创建道路图层
    roadLayer = L.geoJSON(geoJsonData, {
      style: {
        color: getRoadTypeColor(road.road_type || ''),
        weight: getRoadClassWidth(road.road_class || ''),
        opacity: 0.9,
        dashArray: road.maintenance_status === 'maintenance' ? '10,5' : undefined
      }
    })

    // 添加弹出信息
    const popupContent = `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">${road.name || '未命名道路'}</h4>
        <div style="font-size: 13px; line-height: 1.5;">
          <p style="margin: 5px 0;"><strong>道路编号:</strong> ${road.road_id || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>道路类型:</strong> ${getRoadTypeText(road.road_type || '')}</p>
          <p style="margin: 5px 0;"><strong>道路等级:</strong> ${road.road_class ? road.road_class + '级' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>道路长度:</strong> ${road.length ? (road.length / 1000).toFixed(2) + 'km' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>道路宽度:</strong> ${road.width ? road.width + 'm' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>路面类型:</strong> ${road.surface_type || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>最大限速:</strong> ${road.max_speed ? road.max_speed + 'km/h' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>维护状态:</strong> 
            <span style="color: ${road.maintenance_status === 'good' ? '#52c41a' : road.maintenance_status === 'maintenance' ? '#faad14' : '#f5222d'}">
              ${getMaintenanceStatusText(road.maintenance_status || '')}
            </span>
          </p>
          <p style="margin: 5px 0;"><strong>应急路线:</strong> ${road.is_emergency_route ? '是' : '否'}</p>
          <p style="margin: 5px 0;"><strong>双向通行:</strong> ${road.is_bidirectional ? '是' : '否'}</p>
          <p style="margin: 5px 0;"><strong>通行能力:</strong> ${road.traffic_capacity ? road.traffic_capacity + '辆/小时' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>更新时间:</strong> ${road.updated_at ? new Date(road.updated_at).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
    `
    
    roadLayer.bindPopup(popupContent)
    roadLayer.addTo(map)

    // 如果是LineString，添加起终点标记
    if (geometryData.type === 'LineString' && geometryData.coordinates && geometryData.coordinates.length > 0) {
      const coordinates = geometryData.coordinates
      const startCoord = coordinates[0]
      const endCoord = coordinates[coordinates.length - 1]
      
      // 起点标记（绿色）
      const startIcon = L.divIcon({
        className: 'road-marker start-marker',
        html: '<div style="background: #52c41a; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">起</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
      
      startMarker = L.marker([startCoord[1], startCoord[0]], { icon: startIcon })
        .bindPopup('道路起点')
        .addTo(map)
      
      // 终点标记（红色）
      const endIcon = L.divIcon({
        className: 'road-marker end-marker',
        html: '<div style="background: #f5222d; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">终</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
      
      endMarker = L.marker([endCoord[1], endCoord[0]], { icon: endIcon })
        .bindPopup('道路终点')
        .addTo(map)
    }

    // 显示桥梁隧道信息
    displayBridgeTunnelInfo(road)

    // 调整地图视图到道路
    const bounds = roadLayer.getBounds()
    if (bounds.isValid()) {
      console.log('边界信息:', bounds)
      map.fitBounds(bounds, { padding: [20, 20] })
    }

    console.log('道路显示成功')

  } catch (err) {
    console.error('显示道路失败:', err)
    ElMessage.error('显示道路失败')
  }
}

// 显示桥梁隧道信息
const displayBridgeTunnelInfo = (road: RoadNetwork) => {
  const bridgeTunnelData = parseGeometry(road.bridge_tunnel_info)
  if (!bridgeTunnelData || !map) return

  try {
    bridgeTunnelLayer = L.layerGroup()

    // 如果是数组格式的桥梁隧道信息
    if (Array.isArray(bridgeTunnelData)) {
      bridgeTunnelData.forEach((item: any, index: number) => {
        if (item.location && item.location.coordinates) {
          const [lng, lat] = item.location.coordinates
          const type = item.type || 'unknown'
          const name = item.name || `${type === 'bridge' ? '桥梁' : '隧道'}${index + 1}`
          
          const icon = L.divIcon({
            className: `bridge-tunnel-marker ${type}-marker`,
            html: `<div style="background: ${type === 'bridge' ? '#1890ff' : '#fa8c16'}; color: white; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: bold;">${type === 'bridge' ? '桥' : '隧'}</div>`,
            iconSize: [30, 16],
            iconAnchor: [15, 8]
          })
          
          const marker = L.marker([lat, lng], { icon })
            .bindPopup(`
              <div>
                <h5 style="margin: 0 0 5px 0;">${name}</h5>
                <p style="margin: 2px 0;"><strong>类型:</strong> ${type === 'bridge' ? '桥梁' : '隧道'}</p>
                <p style="margin: 2px 0;"><strong>长度:</strong> ${item.length ? item.length + 'm' : 'N/A'}</p>
                <p style="margin: 2px 0;"><strong>高度:</strong> ${item.height ? item.height + 'm' : 'N/A'}</p>
                <p style="margin: 2px 0;"><strong>限重:</strong> ${item.weight_limit ? item.weight_limit + 't' : 'N/A'}</p>
              </div>
            `)
          
          bridgeTunnelLayer?.addLayer(marker)
        }
      })
    }

    if (bridgeTunnelLayer) {
      bridgeTunnelLayer.addTo(map)
    }

  } catch (err) {
    console.error('显示桥梁隧道信息失败:', err)
  }
}

// 清除所有图层
const clearLayers = () => {
  if (!map) return

  if (roadLayer) {
    map.removeLayer(roadLayer)
    roadLayer = null
  }
  if (startMarker) {
    map.removeLayer(startMarker)
    startMarker = null
  }
  if (endMarker) {
    map.removeLayer(endMarker)
    endMarker = null
  }
  if (bridgeTunnelLayer) {
    map.removeLayer(bridgeTunnelLayer)
    bridgeTunnelLayer = null
  }
}

// 监听道路数据变化
watch(() => props.roadNetwork, (newRoad) => {
  if (newRoad && map) {
    console.log('道路数据发生变化，重新显示:', newRoad)
    displayRoadNetwork(newRoad)
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  initializeMap()
})

// 组件卸载
onUnmounted(() => {
  if (resizeObserver && mapContainer.value) {
    resizeObserver.unobserve(mapContainer.value)
  }
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.road-network-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.road-network-map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.map-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-message {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #f5222d;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 道路标记样式 */
:deep(.road-marker) {
  border: none !important;
  background: transparent !important;
}

:deep(.bridge-tunnel-marker) {
  border: none !important;
  background: transparent !important;
}

/* Leaflet弹窗样式优化 */
:deep(.leaflet-popup-content) {
  margin: 12px 16px !important;
  line-height: 1.6 !important;
}

:deep(.leaflet-popup-content h4) {
  color: #1890ff !important;
  border-bottom: 1px solid #f0f0f0 !important;
  padding-bottom: 8px !important;
}

:deep(.leaflet-popup-content h5) {
  color: #1890ff !important;
  margin-bottom: 8px !important;
}
</style>