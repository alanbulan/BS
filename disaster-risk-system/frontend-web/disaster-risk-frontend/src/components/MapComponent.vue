<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- 地图控制面板 -->
    <div class="map-controls">
      <el-button-group>
        <el-button 
          :type="layerVisibility.risk ? 'primary' : 'default'"
          @click="toggleLayer('risk')"
          size="small"
        >
          <i class="el-icon-warning-outline"></i>
          风险区域
        </el-button>
        <el-button 
          :type="layerVisibility.monitoring ? 'primary' : 'default'"
          @click="toggleLayer('monitoring')"
          size="small"
        >
          <i class="el-icon-monitor"></i>
          监测站点
        </el-button>
        <el-button 
          :type="layerVisibility.warning ? 'primary' : 'default'"
          @click="toggleLayer('warning')"
          size="small"
        >
          <i class="el-icon-bell"></i>
          预警信息
        </el-button>
      </el-button-group>
    </div>
    
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
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 修复Leaflet图标路径问题
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})
import { riskZonesApi } from '@/api/modules/riskZones'
import { monitoringStationsApi } from '@/api/modules/monitoring'
import { warningsApi } from '@/api/modules/warnings'
import { ElMessage } from 'element-plus'
import type { RiskZone, MonitoringStation, Warning } from '@/types'

// Props
interface Props {
  height?: string
  center?: [number, number]
  zoom?: number
  showUserLocation?: boolean
  userLocation?: [number, number]
  userName?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%',
  center: () => [39.9042, 116.4074], // 北京坐标
  zoom: 10,
  showUserLocation: false,
  userName: '用户'
})

// 响应式数据
const mapContainer = ref<HTMLDivElement>()
const error = ref<string>('')
const layerVisibility = ref({
  risk: true,
  monitoring: true,
  warning: true
})

// 地图实例和图层组
let map: L.Map | null = null
let riskLayerGroup: L.LayerGroup | null = null
let monitoringLayerGroup: L.LayerGroup | null = null
let warningLayerGroup: L.LayerGroup | null = null
let userLocationLayerGroup: L.LayerGroup | null = null

// 初始化地图
const initializeMap = async () => {
  try {
    if (!mapContainer.value) {
      throw new Error('地图容器未找到')
    }

    // 创建地图实例
    map = L.map(mapContainer.value).setView(props.center, props.zoom)

    // 添加瓦片图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // 创建图层组
    riskLayerGroup = L.layerGroup()
    monitoringLayerGroup = L.layerGroup()
    warningLayerGroup = L.layerGroup()
    userLocationLayerGroup = L.layerGroup()
    
    // 根据初始可见性状态添加图层组到地图
    if (layerVisibility.value.risk) {
      riskLayerGroup.addTo(map)
    }
    if (layerVisibility.value.monitoring) {
      monitoringLayerGroup.addTo(map)
    }
    if (layerVisibility.value.warning) {
      warningLayerGroup.addTo(map)
    }
    userLocationLayerGroup.addTo(map)  // 用户位置图层总是添加

    // 加载数据
    await Promise.all([
      loadRiskZones(),
      loadMonitoringStations(),
      loadWarnings()
    ])

    // 加载用户位置
    if (props.showUserLocation && props.userLocation) {
      loadUserLocation()
    }

    error.value = ''
  } catch (err) {
    console.error('地图初始化失败:', err)
    error.value = '地图加载失败，请刷新页面重试'
  }
}

// 切换图层显示
const toggleLayer = (layerType: 'risk' | 'monitoring' | 'warning') => {
  layerVisibility.value[layerType] = !layerVisibility.value[layerType]
  
  const layerGroup = {
    risk: riskLayerGroup,
    monitoring: monitoringLayerGroup,
    warning: warningLayerGroup
  }[layerType]
  
  if (layerGroup && map) {
    if (layerVisibility.value[layerType]) {
      map.addLayer(layerGroup)
    } else {
      map.removeLayer(layerGroup)
    }
  }
}

// 获取风险级别颜色
const getRiskColor = (level: number): string => {
  switch (level) {
    case 1: return '#52c41a' // 低风险 - 绿色
    case 2: return '#faad14' // 中风险 - 橙色
    case 3: return '#f5222d' // 高风险 - 红色
    default: return '#d9d9d9' // 未知 - 灰色
  }
}

// 获取预警颜色
const getWarningColor = (level: number): string => {
  switch (level) {
    case 1: return '#1890ff' // 蓝色预警
    case 2: return '#faad14' // 黄色预警
    case 3: return '#fa8c16' // 橙色预警
    case 4: return '#f5222d' // 红色预警
    default: return '#d9d9d9' // 未知
  }
}

// 解析WKT格式的Point坐标
const parseWKTPoint = (wkt: string): [number, number] | null => {
  if (!wkt || typeof wkt !== 'string') return null
  
  // 匹配 POINT(longitude latitude) 格式
  const pointMatch = wkt.match(/POINT\s*\(([^)]+)\)/i)
  if (pointMatch) {
    const coords = pointMatch[1].trim().split(/\s+/)
    if (coords.length >= 2) {
      const lng = parseFloat(coords[0])
      const lat = parseFloat(coords[1])
      if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
        return [lat, lng] // Leaflet使用[lat, lng]格式
      }
    }
  }
  return null
}

// 解析WKT格式的Polygon坐标
const parseWKTPolygon = (wkt: string): [number, number][] | null => {
  if (!wkt || typeof wkt !== 'string') return null
  
  // 匹配 POLYGON((coordinates)) 格式
  const polygonMatch = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i)
  if (polygonMatch) {
    const coordsStr = polygonMatch[1].trim()
    const coordPairs = coordsStr.split(',')
    const coordinates: [number, number][] = []
    
    for (const pair of coordPairs) {
      const coords = pair.trim().split(/\s+/)
      if (coords.length >= 2) {
        const lng = parseFloat(coords[0])
        const lat = parseFloat(coords[1])
        if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
          coordinates.push([lat, lng]) // Leaflet使用[lat, lng]格式
        }
      }
    }
    
    return coordinates.length > 0 ? coordinates : null
  }
  return null
}

// 获取预警大小
const getWarningSize = (level: number): number => {
  switch (level) {
    case 1: return 8
    case 2: return 10
    case 3: return 12
    case 4: return 15
    default: return 10
  }
}

// 获取预警状态文本
const getWarningStatusText = (status: string): string => {
  switch (status) {
    case 'active': return '生效中'
    case 'expired': return '已过期'
    case 'cancelled': return '已取消'
    default: return '未知状态'
  }
}

// 加载风险区域
const loadRiskZones = async () => {
  if (!riskLayerGroup) {
    console.error('风险区域图层组未初始化')
    return
  }
  
  // 确保图层组在地图上
  if (map && layerVisibility.value.risk && !map.hasLayer(riskLayerGroup)) {
    console.log('重新添加风险区域图层组到地图')
    riskLayerGroup.addTo(map)
  }
  
  console.log('开始加载风险区域，图层组状态:', {
    hasLayerGroup: !!riskLayerGroup,
    isOnMap: map ? map.hasLayer(riskLayerGroup) : false,
    visibility: layerVisibility.value.risk
  })

  try {
    const response = await riskZonesApi.getRiskZones({ limit: 1000 })
    
    if (response.success && response.data) {
      const zones = response.data
      const validPolygons: L.Polygon[] = []
      
      zones.forEach((zone: RiskZone, index: number) => {
        console.log(`处理风险区域 ${index + 1}/${zones.length}: ${zone.name}`, zone)
        
        if (zone.geometry && zone.geometry.type === 'Polygon' && zone.geometry.coordinates) {
          // 处理多边形的所有坐标环（外环和内环）
          const coordinateRings = zone.geometry.coordinates
          
          if (coordinateRings.length > 0) {
            // 使用外环坐标（第一个坐标环）
            const coords = coordinateRings[0]
            console.log(`风险区域 ${zone.name} 原始坐标数量:`, coords.length)
            
            // 验证坐标有效性
            const validCoords = coords.filter((coord: any) => {
              const isValid = Array.isArray(coord) && coord.length >= 2 && 
                     typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                     !isNaN(coord[0]) && !isNaN(coord[1]) && 
                     isFinite(coord[0]) && isFinite(coord[1])
              if (!isValid) {
                console.warn(`风险区域 ${zone.name} 发现无效坐标:`, coord)
              }
              return isValid
            })
            
            console.log(`风险区域 ${zone.name} 有效坐标数量:`, validCoords.length)
            
            if (validCoords.length >= 3) { // 多边形至少需要3个点
              // 转换坐标格式：从 [lng, lat] 到 [lat, lng]
              const leafletCoords = validCoords.map((coord: any) => {
                return [coord[1], coord[0]] as [number, number];
              })
              
              const polygon = L.polygon(leafletCoords, {
                color: getRiskColor(zone.base_risk_level || 1),
                weight: 3,  // 边框宽度
                opacity: 1.0,  // 边框完全不透明
                fillColor: getRiskColor(zone.base_risk_level || 1),
                fillOpacity: 0.8,  // 增加填充透明度，让颜色更明显
                dashArray: undefined  // 确保是实线
              })
              
              console.log(`创建多边形 ${zone.name}，坐标:`, leafletCoords, '样式:', {
                color: getRiskColor(zone.base_risk_level || 1),
                weight: 4,
                opacity: 0.9,
                fillOpacity: 0.6
              })
              
              // 添加弹窗
              const popupContent = `
                <div style="min-width: 250px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">${zone.name || '未命名区域'}</h4>
                  <p style="margin: 4px 0;"><strong>区域编码:</strong> ${zone.code || 'N/A'}</p>
                  <p style="margin: 4px 0;"><strong>风险级别:</strong> ${zone.base_risk_level || 'N/A'} 级</p>
                  <p style="margin: 4px 0;"><strong>灾害类型:</strong> ${zone.disaster_type?.name || 'N/A'}</p>
                  <p style="margin: 4px 0;"><strong>行政级别:</strong> ${zone.administrative_level || 'N/A'}</p>
                  <p style="margin: 4px 0;"><strong>人口密度:</strong> ${zone.population_density ? zone.population_density.toFixed(1) + ' 人/km²' : 'N/A'}</p>
                  <p style="margin: 4px 0;"><strong>平均海拔:</strong> ${zone.elevation_avg ? zone.elevation_avg.toFixed(1) + ' 米' : 'N/A'}</p>
                  <p style="margin: 4px 0;"><strong>负责部门:</strong> ${zone.responsible_department || 'N/A'}</p>
                  <p style="margin: 4px 0;"><strong>是否监测:</strong> ${zone.is_monitored ? '是' : '否'}</p>
                </div>
              `
              
              polygon.bindPopup(popupContent)
              if (riskLayerGroup) {
                riskLayerGroup.addLayer(polygon)
                console.log(`成功添加风险区域 ${zone.name} 到图层组，图层组当前包含 ${riskLayerGroup.getLayers().length} 个图层`)
                console.log(`风险区域图层组是否在地图上:`, map && map.hasLayer(riskLayerGroup))
                
                // 立即检查多边形是否可见
                const bounds = polygon.getBounds()
                console.log(`多边形 ${zone.name} 边界:`, bounds)
                console.log(`多边形 ${zone.name} 样式:`, polygon.options)
              }
              validPolygons.push(polygon)
            } else {
              console.error(`风险区域 ${zone.name} 有效坐标不足，无法创建多边形。需要至少3个点，当前有效点数: ${validCoords.length}`)
            }
          } else {
            console.error(`风险区域 ${zone.name} 没有坐标环数据`)
          }
        } else {
          console.error(`风险区域 ${zone.name} 几何数据无效:`, zone.geometry)
        }
      })
      
      console.log(`总共处理了 ${zones.length} 个风险区域，成功创建了 ${validPolygons.length} 个多边形`)
      
      // 最终状态检查
      if (riskLayerGroup && map) {
        console.log('=== 最终状态检查 ===')
        console.log('图层组中的图层数量:', riskLayerGroup.getLayers().length)
        console.log('图层组是否在地图上:', map.hasLayer(riskLayerGroup))
        console.log('图层组可见性设置:', layerVisibility.value.risk)
        console.log('地图缩放级别:', map.getZoom())
        console.log('地图中心点:', map.getCenter())
        
        // 如果图层组不在地图上，强制添加
        if (!map.hasLayer(riskLayerGroup) && layerVisibility.value.risk) {
          console.log('强制添加图层组到地图')
          riskLayerGroup.addTo(map)
        }
      }
      
      // 调整地图视图以显示所有风险区域
      if (validPolygons.length > 0 && map) {
        const group = new L.FeatureGroup(validPolygons)
        const bounds = group.getBounds()
        console.log('风险区域边界:', bounds)
        console.log('边界中心点:', bounds.getCenter())
        
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 13  // 增加最大缩放级别，让多边形更容易看到
        })
        
        console.log('地图当前缩放级别:', map.getZoom())
        console.log('地图当前中心点:', map.getCenter())
        
        // 强制刷新地图显示
        setTimeout(() => {
          if (map) {
            map.invalidateSize()
            console.log('地图显示已刷新')
          }
        }, 100)
      }
    } else {
      ElMessage.warning('暂无风险区域数据')
    }
  } catch (error) {
    console.error('加载风险区域失败:', error)
    ElMessage.error('加载风险区域失败')
  }
}

// 加载监测站点
const loadMonitoringStations = async () => {
  if (!monitoringLayerGroup) return

  try {
    const response = await monitoringStationsApi.getStations({ limit: 1000 })
    console.log('监测站点API响应:', response)
    
    if (response.success && response.data) {
      const stations = response.data
      console.log('监测站点数据:', stations)
      
      stations.forEach((station: MonitoringStation) => {
        console.log('处理监测站点:', station)
        let coordinates: [number, number] | null = null
        
        // 优先使用latitude和longitude字段
        if (station.latitude && station.longitude && 
            !isNaN(station.latitude) && !isNaN(station.longitude) &&
            isFinite(station.latitude) && isFinite(station.longitude)) {
          coordinates = [station.latitude, station.longitude]
          console.log('使用latitude/longitude:', coordinates)
        }
        // 如果没有latitude/longitude，尝试解析location_wkt字段的WKT格式
        else if (station.location_wkt) {
          console.log('解析WKT location_wkt:', station.location_wkt)
          coordinates = parseWKTPoint(station.location_wkt)
          console.log('解析结果:', coordinates)
        }
        
        if (coordinates) {
          const marker = L.circleMarker(coordinates, {
            radius: 8,
            fillColor: '#1890ff',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          })
          
          const popupContent = `
            <div style="min-width: 280px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">${station.name || '未命名站点'}</h4>
              <p style="margin: 4px 0;"><strong>站点编号:</strong> ${station.station_id || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>站点类型:</strong> ${station.station_type || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>运行状态:</strong> <span style="color: ${station.is_active ? '#52c41a' : '#f5222d'}">${station.is_active ? '在线' : '离线'}</span></p>
              <p style="margin: 4px 0;"><strong>坐标位置:</strong> ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}</p>
              <p style="margin: 4px 0;"><strong>安装日期:</strong> ${station.installation_date ? new Date(station.installation_date).toLocaleDateString('zh-CN') : 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>数据传输间隔:</strong> ${station.data_transmission_interval ? station.data_transmission_interval + ' 秒' : 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>所属风险区域:</strong> ${station.zone_name || 'N/A'}</p>
              ${station.equipment_info ? `<div style="margin-top: 8px; padding: 8px; background-color: #f5f5f5; border-radius: 4px;"><strong>设备信息:</strong><br/>${JSON.stringify(station.equipment_info, null, 2).replace(/[{}"]/g, '').replace(/,/g, '<br/>')}</div>` : ''}
            </div>
          `
          
          marker.bindPopup(popupContent)
          if (monitoringLayerGroup) {
            monitoringLayerGroup.addLayer(marker)
          }
        }
      })
    } else {
      ElMessage.warning('暂无监测站点数据')
    }
  } catch (error) {
    console.error('加载监测站点失败:', error)
    ElMessage.error('加载监测站点失败')
  }
}

// 加载预警信息
const loadWarnings = async () => {
  if (!warningLayerGroup) return

  try {
    const response = await warningsApi.getActiveWarnings()
    console.log('预警信息API响应:', response)
    
    if (response.success && response.data) {
      const warnings = response.data
      console.log('预警信息数据:', warnings)
      
      warnings.forEach((warning: Warning) => {
        console.log('处理预警信息:', warning)
        let coordinates: [number, number] | null = null
        let polygonCoords: [number, number][] | null = null
        
        // 解析affected_area_wkt字段的WKT格式
        if (warning.affected_area_wkt) {
          console.log('解析预警affected_area_wkt:', warning.affected_area_wkt)
          // 尝试解析为多边形
          polygonCoords = parseWKTPolygon(warning.affected_area_wkt)
          console.log('多边形解析结果:', polygonCoords)
          if (polygonCoords && polygonCoords.length > 0) {
            // 计算多边形中心点
            const centerLat = polygonCoords.reduce((sum, coord) => sum + coord[0], 0) / polygonCoords.length
            const centerLng = polygonCoords.reduce((sum, coord) => sum + coord[1], 0) / polygonCoords.length
            console.log('多边形中心点:', [centerLat, centerLng])
            if (!isNaN(centerLat) && !isNaN(centerLng) && isFinite(centerLat) && isFinite(centerLng)) {
              coordinates = [centerLat, centerLng]
            }
            
            // 绘制多边形
            const polygon = L.polygon(polygonCoords, {
              color: getWarningColor(warning.warning_level || 2),
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3
            })
            
            const popupContent = `
              <div style="min-width: 300px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${warning.title || '未命名预警'}</h4>
                <p style="margin: 4px 0;"><strong>预警编号:</strong> ${warning.warning_id || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>预警级别:</strong> <span style="color: ${getWarningColor(warning.warning_level || 2)}">${warning.warning_level === 1 ? '蓝色预警' : warning.warning_level === 2 ? '黄色预警' : warning.warning_level === 3 ? '橙色预警' : warning.warning_level === 4 ? '红色预警' : 'N/A'}</span></p>
                <p style="margin: 4px 0;"><strong>灾害类型:</strong> ${warning.disaster_type_name || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>预警状态:</strong> <span style="color: ${warning.status === 'active' ? '#52c41a' : warning.status === 'expired' ? '#f5222d' : '#faad14'}">${getWarningStatusText(warning.status || '')}</span></p>
                <p style="margin: 4px 0;"><strong>发布时间:</strong> ${warning.issue_time ? new Date(warning.issue_time).toLocaleString('zh-CN') : 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>生效时间:</strong> ${warning.effective_time ? new Date(warning.effective_time).toLocaleString('zh-CN') : 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>过期时间:</strong> ${warning.expiry_time ? new Date(warning.expiry_time).toLocaleString('zh-CN') : 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>发布机构:</strong> ${warning.issuing_authority || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>影响区域:</strong> ${warning.zone_name || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>疏散要求:</strong> ${warning.evacuation_required ? '是' : '否'}</p>
                <p style="margin: 4px 0;"><strong>预计影响人口:</strong> ${warning.estimated_affected_population ? warning.estimated_affected_population.toLocaleString() + ' 人' : 'N/A'}</p>
                ${warning.content ? `<div style="margin-top: 8px; padding: 8px; background-color: #f0f8ff; border-radius: 4px; border-left: 3px solid #1890ff;"><strong>预警内容:</strong><br/>${warning.content}</div>` : ''}
               ${warning.recommended_actions ? `<div style="margin-top: 8px; padding: 8px; background-color: #fff7e6; border-radius: 4px; border-left: 3px solid #fa8c16;"><strong>建议措施:</strong><br/>${typeof warning.recommended_actions === 'string' ? warning.recommended_actions : JSON.stringify(warning.recommended_actions, null, 2).replace(/[{}"]/g, '').replace(/,/g, '<br/>')}</div>` : ''}
               ${warning.contact_info ? `<div style="margin-top: 8px; padding: 8px; background-color: #f6ffed; border-radius: 4px; border-left: 3px solid #52c41a;"><strong>联系信息:</strong><br/>${typeof warning.contact_info === 'string' ? warning.contact_info : JSON.stringify(warning.contact_info, null, 2).replace(/[{}"]/g, '').replace(/,/g, '<br/>')}</div>` : ''}
              </div>
            `
            
            polygon.bindPopup(popupContent)
            if (warningLayerGroup) {
              warningLayerGroup.addLayer(polygon)
            }
          } else {
            // 尝试解析为点
            coordinates = parseWKTPoint(warning.affected_area_wkt)
          }
        }
        
        // 从风险区域的geometry中提取坐标（备用方案）
        if (!coordinates && warning.risk_zone?.geometry) {
          if (warning.risk_zone.geometry.type === 'Point') {
            const coords = warning.risk_zone.geometry.coordinates
            if (coords && coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && 
                !isNaN(coords[0]) && !isNaN(coords[1]) && isFinite(coords[0]) && isFinite(coords[1])) {
              coordinates = [coords[1], coords[0]]
            }
          } else if (warning.risk_zone.geometry.type === 'Polygon') {
            const coords = warning.risk_zone.geometry.coordinates[0]
            const validCoords = coords.filter((coord: number[]) => {
              return Array.isArray(coord) && coord.length >= 2 && 
                     typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                     !isNaN(coord[0]) && !isNaN(coord[1]) && 
                     isFinite(coord[0]) && isFinite(coord[1])
            })
            
            if (validCoords.length > 0) {
              const centerLng = validCoords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / validCoords.length
              const centerLat = validCoords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / validCoords.length
              if (!isNaN(centerLat) && !isNaN(centerLng) && isFinite(centerLat) && isFinite(centerLng)) {
                coordinates = [centerLat, centerLng]
              }
            }
          }
        }
        
        // 创建点标记
        if (coordinates && Array.isArray(coordinates) && coordinates.length === 2 && 
            typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number' && 
            !isNaN(coordinates[0]) && !isNaN(coordinates[1]) && 
            isFinite(coordinates[0]) && isFinite(coordinates[1])) {
          
          const marker = L.circleMarker(coordinates, {
            radius: getWarningSize(warning.warning_level || 2),
            fillColor: getWarningColor(warning.warning_level || 2),
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          })
          
          const popupContent = `
            <div style="min-width: 300px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">${warning.title || '未命名预警'}</h4>
              <p style="margin: 4px 0;"><strong>预警编号:</strong> ${warning.warning_id || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>预警级别:</strong> <span style="color: ${getWarningColor(warning.warning_level || 2)}">${warning.warning_level === 1 ? '蓝色预警' : warning.warning_level === 2 ? '黄色预警' : warning.warning_level === 3 ? '橙色预警' : warning.warning_level === 4 ? '红色预警' : 'N/A'}</span></p>
              <p style="margin: 4px 0;"><strong>灾害类型:</strong> ${warning.disaster_type_name || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>预警状态:</strong> <span style="color: ${warning.status === 'active' ? '#52c41a' : warning.status === 'expired' ? '#f5222d' : '#faad14'}">${getWarningStatusText(warning.status || '')}</span></p>
              <p style="margin: 4px 0;"><strong>发布时间:</strong> ${warning.issue_time ? new Date(warning.issue_time).toLocaleString('zh-CN') : 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>生效时间:</strong> ${warning.effective_time ? new Date(warning.effective_time).toLocaleString('zh-CN') : 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>过期时间:</strong> ${warning.expiry_time ? new Date(warning.expiry_time).toLocaleString('zh-CN') : 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>发布机构:</strong> ${warning.issuing_authority || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>影响区域:</strong> ${warning.zone_name || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>疏散要求:</strong> ${warning.evacuation_required ? '是' : '否'}</p>
              <p style="margin: 4px 0;"><strong>预计影响人口:</strong> ${warning.estimated_affected_population ? warning.estimated_affected_population.toLocaleString() + ' 人' : 'N/A'}</p>
              ${warning.content ? `<div style="margin-top: 8px; padding: 8px; background-color: #f0f8ff; border-radius: 4px; border-left: 3px solid #1890ff;"><strong>预警内容:</strong><br/>${warning.content}</div>` : ''}
               ${warning.recommended_actions ? `<div style="margin-top: 8px; padding: 8px; background-color: #fff7e6; border-radius: 4px; border-left: 3px solid #fa8c16;"><strong>建议措施:</strong><br/>${typeof warning.recommended_actions === 'string' ? warning.recommended_actions : JSON.stringify(warning.recommended_actions, null, 2).replace(/[{}"]/g, '').replace(/,/g, '<br/>')}</div>` : ''}
               ${warning.contact_info ? `<div style="margin-top: 8px; padding: 8px; background-color: #f6ffed; border-radius: 4px; border-left: 3px solid #52c41a;"><strong>联系信息:</strong><br/>${typeof warning.contact_info === 'string' ? warning.contact_info : JSON.stringify(warning.contact_info, null, 2).replace(/[{}"]/g, '').replace(/,/g, '<br/>')}</div>` : ''}
            </div>
          `
          
          marker.bindPopup(popupContent)
          if (warningLayerGroup) {
            warningLayerGroup.addLayer(marker)
          }
        }
      })
      
      if (warnings.length === 0) {
        console.warn('没有找到预警信息')
      }
    } else {
      ElMessage.warning('暂无预警信息')
    }
  } catch (error) {
    console.error('加载预警信息失败:', error)
    ElMessage.error('加载预警信息失败')
  }
}

// 加载用户位置
const loadUserLocation = () => {
  if (!userLocationLayerGroup || !props.userLocation) return

  try {
    const [lat, lng] = props.userLocation
    
    // 创建自定义用户位置图标
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-marker-container">
          <div class="user-marker-pulse"></div>
          <div class="user-marker-icon">
            <i class="el-icon-user"></i>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
    
    // 创建用户位置标记
    const userMarker = L.marker([lat, lng], { icon: userIcon })
    
    // 添加弹窗
    const popupContent = `
      <div style="min-width: 200px; text-align: center;">
        <h4 style="margin: 0 0 8px 0; color: #ff4081;">
          <i class="el-icon-user"></i> ${props.userName}
        </h4>
        <p style="margin: 4px 0;"><strong>位置:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        <p style="margin: 4px 0; color: #52c41a;"><strong>状态:</strong> 在线</p>
        <p style="margin: 4px 0; font-size: 12px; color: #999;">点击标记查看详细信息</p>
      </div>
    `
    
    userMarker.bindPopup(popupContent)
    userLocationLayerGroup.addLayer(userMarker)
    
    // 强制聚焦到用户位置，使用更高的缩放级别
    if (map) {
      // 设置地图视图到用户位置，使用18级缩放（更近距离）
      map.setView([lat, lng], 18, {
        animate: true,
        duration: 1.5
      })
      
      // 延迟打开弹窗以吸引注意
      setTimeout(() => {
        userMarker.openPopup()
      }, 2000)
    }
    
  } catch (error) {
    console.error('加载用户位置失败:', error)
  }
}

// 组件挂载
onMounted(async () => {
  await initializeMap()
})

// 组件卸载
onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  
  // 清理图层组
  riskLayerGroup = null
  monitoringLayerGroup = null
  warningLayerGroup = null
  userLocationLayerGroup = null
})

// 暴露地图实例
defineExpose({
  map
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  z-index: 1001;
}

/* 用户位置标记样式 - 独特的钻石形状设计 */
:deep(.user-location-marker) {
  background: transparent;
  border: none;
}

:deep(.user-marker-container) {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.user-marker-pulse) {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 107, 129, 0.4), rgba(255, 64, 129, 0.2));
  animation: userPulse 2.5s infinite;
  box-shadow: 0 0 20px rgba(255, 107, 129, 0.3);
}

:deep(.user-marker-icon) {
  position: relative;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ff6b81, #ff4081);
  border: 3px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(255, 107, 129, 0.4);
  transform: rotate(45deg);
}

:deep(.user-marker-icon)::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 8px solid #ff4081;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

:deep(.user-marker-icon i) {
  transform: rotate(-45deg);
}

@keyframes userPulse {
  0% {
    transform: scale(0.7);
    opacity: 1;
  }
  40% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.3);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.error-message {
  text-align: center;
  color: #f5222d;
  font-size: 16px;
}

.error-message i {
  font-size: 24px;
  margin-bottom: 8px;
  display: block;
}
</style>