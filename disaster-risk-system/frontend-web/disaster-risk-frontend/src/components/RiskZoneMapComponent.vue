<template>
  <div class="risk-zone-map-wrapper">
    <div ref="mapContainer" class="risk-zone-map-container"></div>
    
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
import type { RiskZone, DisasterType } from '@/types'

// Props
interface Props {
  riskZone?: RiskZone | null
  center?: [number, number]
  zoom?: number
  height?: string
  disasterTypes?: DisasterType[]
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [39.9042, 116.4074],
  zoom: 12,
  height: '400px',
  disasterTypes: () => []
})

// 响应式数据
const mapContainer = ref<HTMLElement>()
const error = ref<string>('')
let map: L.Map | null = null
let riskZoneLayer: L.GeoJSON | null = null
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

    // 等待地图完全加载后再显示风险区域
    map.whenReady(() => {
      console.log('地图已准备就绪')
      if (props.riskZone) {
        console.log('地图准备就绪后显示风险区域:', props.riskZone)
        displayRiskZone(props.riskZone)
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

// 显示风险区域
const displayRiskZone = (zone: RiskZone) => {
  console.log('开始显示风险区域:', zone.name, 'ID:', zone.id)
  
  // 检查几何数据，使用geometry字段
  const geometryData = zone.geometry
  if (!map) {
    console.error('地图对象不存在')
    return
  }
  
  if (!geometryData) {
    console.error('几何数据不存在:', { 
      geometry: zone.geometry,
      zone: zone
    })
    ElMessage.error('风险区域没有几何数据')
    return
  }

  // 移除之前的图层
  if (riskZoneLayer) {
    map.removeLayer(riskZoneLayer)
    riskZoneLayer = null
    console.log('移除了之前的图层')
  }

  try {
    // 解析几何数据
    let geometry = geometryData
    console.log('原始几何数据:', geometry, '类型:', typeof geometry)
    
    if (typeof geometry === 'string') {
      try {
        geometry = JSON.parse(geometry)
        console.log('成功解析字符串格式的几何数据')
      } catch (e) {
        console.error('几何数据解析失败:', e, '原始数据:', geometry)
        ElMessage.error('几何数据解析失败')
        return
      }
    }
    
    console.log('解析后的几何数据:', geometry)
    console.log('几何数据类型:', typeof geometry)
    console.log('几何数据结构:', JSON.stringify(geometry, null, 2))
    
    // 验证几何数据格式
    if (!geometry || !geometry.type || !geometry.coordinates) {
      console.error('几何数据格式不正确:', geometry)
      ElMessage.error('几何数据格式不正确')
      return
    }
    
    // 验证坐标数据
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      console.error('坐标数据无效:', geometry.coordinates)
      ElMessage.error('坐标数据无效')
      return
    }

    // 根据风险等级设置颜色
    const getRiskColor = (level: number) => {
      switch (level) {
        case 1: return '#52c41a' // 低风险 - 绿色
        case 2: return '#faad14' // 中风险 - 黄色
        case 3: return '#fa8c16' // 高风险 - 橙色
        case 4: return '#f5222d' // 极高风险 - 红色
        case 5: return '#a0071e' // 极高风险 - 深红色
        default: return '#d9d9d9' // 未知风险 - 灰色
      }
    }

    // 构造标准的GeoJSON对象
    const geoJsonData: GeoJSON.Feature = {
      type: 'Feature',
      geometry: geometry,
      properties: {
        name: zone.name,
        riskLevel: zone.base_risk_level || 1
      }
    }
    
    console.log('构造的GeoJSON数据:', JSON.stringify(geoJsonData, null, 2))
    
    // 创建GeoJSON图层
    riskZoneLayer = L.geoJSON(geoJsonData, {
      style: {
        color: getRiskColor(zone.base_risk_level || 1),
        weight: 3,  // 增加边框宽度
        opacity: 1,
        fillColor: getRiskColor(zone.base_risk_level || 1),
        fillOpacity: 0.7  // 增加填充透明度
      }
    })
    
    console.log('创建GeoJSON图层成功，样式:', {
      color: getRiskColor(zone.base_risk_level || 1),
      weight: 3,
      opacity: 1,
      fillOpacity: 0.7
    })

    // 获取灾害类型名称
    const getDisasterTypeName = (typeId: number | undefined) => {
      if (!typeId) return 'N/A'
      const disasterType = props.disasterTypes?.find(dt => dt.id === typeId)
      return disasterType?.name || 'N/A'
    }

    // 添加弹出信息
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">${zone.name}</h4>
        <div style="font-size: 13px; line-height: 1.5;">
          <p style="margin: 5px 0;"><strong>风险等级:</strong> ${zone.base_risk_level || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>灾害类型:</strong> ${getDisasterTypeName(zone.disaster_type_id)}</p>
          <p style="margin: 5px 0;"><strong>人口密度:</strong> ${zone.population_density ? zone.population_density + '人/km²' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>平均海拔:</strong> ${zone.elevation_avg ? zone.elevation_avg + 'm' : 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>监测状态:</strong> ${zone.is_monitored ? '已监测' : '未监测'}</p>
          <p style="margin: 5px 0;"><strong>更新时间:</strong> ${zone.updated_at ? new Date(zone.updated_at).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
    `
    
    riskZoneLayer.bindPopup(popupContent)
    
    // 添加到地图
    riskZoneLayer.addTo(map)
    
    // 调整地图视图到风险区域
    const bounds = riskZoneLayer.getBounds()
    if (bounds.isValid()) {
      console.log('边界信息:', bounds)
      // 计算边界的中心点和合适的缩放级别
      const center = bounds.getCenter()
      const boundsSize = Math.max(
        bounds.getNorthEast().lat - bounds.getSouthWest().lat,
        bounds.getNorthEast().lng - bounds.getSouthWest().lng
      )
      
      // 根据边界大小设置合适的缩放级别
      let zoomLevel = 10
      if (boundsSize < 0.01) zoomLevel = 16
      else if (boundsSize < 0.1) zoomLevel = 14
      else if (boundsSize < 0.5) zoomLevel = 12
      else if (boundsSize < 1) zoomLevel = 10
      else zoomLevel = 8
      
      console.log('设置缩放级别:', zoomLevel, '边界大小:', boundsSize)
      
      // 设置地图视图
      map.setView(center, zoomLevel)
      
      // 可选：也可以使用fitBounds但设置更大的填充
      // map.fitBounds(bounds, { 
      //   padding: [50, 50],
      //   maxZoom: zoomLevel
      // })
    }
  } catch (error) {
    console.error('显示风险区域失败:', error)
    ElMessage.error('显示风险区域失败')
  }
}

// 监听风险区域数据变化
watch(() => props.riskZone, (newZone) => {
  console.log('监听到风险区域数据变化:', newZone)
  if (newZone && map) {
    // 确保地图已经准备就绪
    if ((map as any)._loaded) {
      console.log('地图已加载，直接显示风险区域')
      // 延迟一下确保容器尺寸正确
      setTimeout(() => {
        map?.invalidateSize()
        displayRiskZone(newZone)
      }, 200)
    } else {
      console.log('地图未完全加载，等待准备就绪')
      map?.whenReady(() => {
        console.log('地图准备就绪，显示风险区域')
        setTimeout(() => {
          map?.invalidateSize()
          displayRiskZone(newZone)
        }, 200)
      })
    }
  }
}, { deep: true })

// 监听容器尺寸变化
watch(() => props.height, () => {
  if (map) {
    setTimeout(() => {
      map?.invalidateSize()
    }, 100)
  }
})

// 组件挂载
onMounted(() => {
  // 延迟初始化地图，确保DOM容器已经渲染完成
  setTimeout(() => {
    initializeMap()
  }, 100)
})

// 组件卸载
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.risk-zone-map-wrapper {
  position: relative;
  width: 100%;
  height: v-bind(height);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.risk-zone-map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-message {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #e74c3c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 覆盖Leaflet默认样式 */
:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

:deep(.leaflet-popup-content) {
  margin: 12px 16px;
}
</style>