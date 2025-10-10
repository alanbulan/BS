import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import SegmentTabs from '../components/SegmentTabs';
import MapContainer from '../components/MapContainer';
import { listEscapeRoutes, calculateRoute, EscapeRoute, RouteCalculationResult } from '../api/routes';
import { checkLocationInRiskZone, RiskZone as RiskZoneType } from '../api/riskZones';
import { getNearbyShelters, Shelter } from '../api/shelters';

export default function EscapeRoutesScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<'list' | 'map'>('map');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<EscapeRoute[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [routeType, setRouteType] = useState<'fastest' | 'safest' | 'shortest'>('safest');
  const [currentRiskZone, setCurrentRiskZone] = useState<RiskZoneType | null>(null);
  const [nearbyShelters, setNearbyShelters] = useState<Shelter[]>([]);
  const [calculatingStage, setCalculatingStage] = useState('');

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      // 检查是否启用测试模式
      const testModeValue = await AsyncStorage.getItem('testMode');
      const isTestMode = testModeValue === 'true';
      
      if (isTestMode) {
        // 测试模式：使用海淀香山风险区坐标
        const testLocation = {
          latitude: 40.02713505455811,
          longitude: 116.20168232062399
        };
        setLocation(testLocation);
        console.log('[TEST MODE] 位置设置在海淀香山风险区');
        await checkRiskZoneAndShelters(testLocation.longitude, testLocation.latitude);
        loadRoutes(testLocation.longitude, testLocation.latitude);
        return;
      }
      
      // 正常模式：使用真实GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const userLocation = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(userLocation);
        await checkRiskZoneAndShelters(loc.coords.longitude, loc.coords.latitude);
        loadRoutes(loc.coords.longitude, loc.coords.latitude);
      } else {
        Alert.alert('提示', '需要位置权限才能查找附近的逃生路线');
      }
    } catch (error) {
      console.error('获取位置失败:', error);
    }
  };

  // 检查风险区域和附近避难所
  const checkRiskZoneAndShelters = async (lng: number, lat: number) => {
    try {
      // 检查是否在风险区内
      const riskCheck = await checkLocationInRiskZone(lng, lat);
      if (riskCheck.inRiskZone && riskCheck.riskZones && riskCheck.riskZones.length > 0) {
        setCurrentRiskZone(riskCheck.riskZones[0]);
        console.log('[WARNING] 当前位于风险区域:', riskCheck.riskZones[0].name);
        
        // 弹窗警告
        Alert.alert(
          '⚠️ 高风险区域警告',
          `您当前位于 ${riskCheck.riskZones[0].name}\n风险等级: ${riskCheck.riskZones[0].base_risk_level}/5\n\n请立即使用智能路径规划功能计算最安全的撤离路线！`,
          [
            { text: '稍后', style: 'cancel' },
            { 
              text: '立即计算', 
              style: 'default',
              onPress: () => {
                setMode('map');
                setTimeout(() => handleSmartRoute(), 500);
              }
            }
          ]
        );
      } else {
        setCurrentRiskZone(null);
        console.log('[SAFE] 当前位置安全');
      }
      
      // 查询附近避难所（半径10公里 = 10000米）
      const shelters = await getNearbyShelters(lat, lng, 10000);
      setNearbyShelters(shelters.slice(0, 3)); // 只显示最近3个
      console.log(`找到 ${shelters.length} 个附近避难所`, shelters.map(s => s.name));
    } catch (error) {
      console.error('检查风险区域和避难所失败:', error);
    }
  };

  const loadRoutes = async (lng?: number, lat?: number, forceReload: boolean = false) => {
    if (!lng || !lat) return;
    setLoading(true);
    try {
      // 加载附近的逃生路线（包括用户生成的和系统预设的）
      // 增大搜索半径以包含用户路径
      const data = await listEscapeRoutes({ lng, lat, radius_m: 50000 });
      const sortedData = Array.isArray(data) ? data : [];
      
      console.log(`[LOAD] 加载到 ${sortedData.length} 条路径`);
      sortedData.forEach(r => {
        console.log(`  - ID:${r.id}, 名称:${r.route_id}, 用户生成:${(r as any).is_user_generated}, 距离:${r.distance_meters}米`);
      });
      
      setRoutes(sortedData);
    } catch (error) {
      console.error('加载路线失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!location) return;
    setRefreshing(true);
    await loadRoutes(location.longitude, location.latitude);
    setRefreshing(false);
  };

  // 智能路径计算（带动画效果）
  const handleSmartRoute = async () => {
    if (!location) {
      Alert.alert('提示', '需要位置权限才能计算路径');
      return;
    }

    setCalculating(true);
    setMode('map'); // 立即切换到地图视图
    
    try {
      // 阶段1：准备数据
      setCalculatingStage('正在分析周边道路...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 阶段2：开始计算
      setCalculatingStage('使用A*算法计算最优路径...');
      console.log('[ROUTE] 开始智能路径计算');
      
      const result = await calculateRoute({
        startLng: location.longitude,
        startLat: location.latitude,
        routeType: routeType,
        avoidHighRiskZones: true,
        maxDistance: 20,
        transportMode: 'walking'
      });

      // 阶段3：处理结果
      setCalculatingStage('绘制路径...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[ROUTE] 路径计算成功');
      setCalculatedRoute(result);
      
      // 阶段4：重新加载路径列表
      setCalculatingStage('保存路径...');
      if (location) {
        await loadRoutes(location.longitude, location.latitude, true);
      }
      
      setCalculatingStage('');
      
      // 显示成功提示（带动画结束）
      setTimeout(() => {
        Alert.alert(
          '路径规划完成',
          `已为您规划最安全的撤离路线\n\n` +
          `距离: ${(result.totalDistance / 1000).toFixed(2)}公里\n` +
          `时间: ${result.estimatedTime}分钟\n` +
          `安全评分: ${result.safetyScore}/5` +
          (result.warnings && result.warnings.length > 0 ? `\n\n警告: ${result.warnings[0]}` : ''),
          [{ text: '开始导航', style: 'default' }]
        );
      }, 300);
    } catch (error: any) {
      console.error('[ERROR] 智能路径计算失败:', error);
      setCalculatingStage('');
      Alert.alert('计算失败', error.message || '无法计算路径，请稍后重试');
    } finally {
      setCalculating(false);
      setCalculatingStage('');
    }
  };

  const geojson = useMemo(() => {
    const features: import('geojson').Feature[] = [];
    
    // 1. 添加当前风险区域（红色填充）
    if (currentRiskZone?.geometry) {
      const geometry = currentRiskZone.geometry;
      
      // 验证geometry是有效的GeoJSON格式
      if (geometry && geometry.type && geometry.coordinates) {
        features.push({
          type: 'Feature',
          properties: { 
            id: `risk-${currentRiskZone.id}`,
            title: currentRiskZone.name,
            riskLevel: currentRiskZone.base_risk_level,
            fill: '#F56C6C',
            'fill-opacity': 0.25,
            stroke: '#F56C6C',
            'stroke-width': 2,
            'stroke-opacity': 0.8
          },
          geometry: geometry
        } as import('geojson').Feature);
      } else {
        console.log('风险区域geometry格式不正确:', geometry);
      }
    }
    
    // 2. 添加起点标记（当前位置 - 脉冲效果）
    if (location) {
      features.push({
        type: 'Feature',
        properties: { 
          id: 'start-marker',
          title: '您的位置',
          type: 'start',
          icon: 'person-circle',
          color: '#409EFF',
          size: 'large',
          pulse: true
        },
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        }
      } as import('geojson').Feature);
    }
    
    // 3. 添加计算的路径（主路径 - 红色粗线）
    if (calculatedRoute?.route?.route_geometry) {
      const routeCoords = calculatedRoute.route.route_geometry.coordinates;
      const routeStart = routeCoords[0];
      const routeEnd = routeCoords[routeCoords.length - 1];
      
      console.log('[MAP] 绘制路径:', {
        points: routeCoords.length,
        start: routeStart,
        end: routeEnd,
        hasEndPoint: !!calculatedRoute.route.end_point,
        nearbyShelters: nearbyShelters.length
      });
      
      // 3a. 添加从用户位置到路径起点的连接线（虚线）
      if (location) {
        const userCoords = [location.longitude, location.latitude];
        const distanceToStart = Math.sqrt(
          Math.pow(userCoords[0] - routeStart[0], 2) + 
          Math.pow(userCoords[1] - routeStart[1], 2)
        ) * 111320; // 转换为米
        
        if (distanceToStart > 50) { // 如果距离超过50米才显示连接线
          features.push({
            type: 'Feature',
            properties: { 
              id: 'connect-to-start',
              title: '前往路径起点',
              stroke: '#409EFF',
              'stroke-width': 3,
              'stroke-opacity': 0.6,
              'stroke-dasharray': '10,5'
            },
            geometry: {
              type: 'LineString',
              coordinates: [userCoords, routeStart]
            }
          } as import('geojson').Feature);
        }
      }
      
      // 3b. 主路径
      features.push({
        type: 'Feature',
        properties: { 
          id: 'calculated-route', 
          title: '智能撤离路径 (A*)', 
          safety: calculatedRoute.safetyScore,
          distance: calculatedRoute.totalDistance,
          time: calculatedRoute.estimatedTime,
          stroke: '#F56C6C',
          'stroke-width': 6,
          'stroke-opacity': 0.95
        },
        geometry: calculatedRoute.route.route_geometry as any
      } as import('geojson').Feature);
      
      // 4. 添加终点到避难所的连接线和标记
      const routeEndCoords = routeEnd;
      const nearestShelter = nearbyShelters.length > 0 ? nearbyShelters[0] : null;
      
      console.log('[MAP] 终点标记:', {
        nearestShelter: nearestShelter?.name,
        hasLocation: !!nearestShelter?.location,
        hasCoordinates: !!nearestShelter?.location?.coordinates,
        coordinates: nearestShelter?.location?.coordinates,
        routeEndCoords: routeEndCoords
      });
      
      if (nearestShelter?.location?.coordinates) {
        const shelterCoords = nearestShelter.location.coordinates;
        const distanceToEnd = Math.sqrt(
          Math.pow(routeEndCoords[0] - shelterCoords[0], 2) + 
          Math.pow(routeEndCoords[1] - shelterCoords[1], 2)
        ) * 111320; // 转换为米
        
        // 4a. 如果路径终点距离避难所超过50米，添加连接线
        if (distanceToEnd > 50) {
          features.push({
            type: 'Feature',
            properties: { 
              id: 'connect-to-end',
              title: '到达避难所',
              stroke: '#67C23A',
              'stroke-width': 3,
              'stroke-opacity': 0.6,
              'stroke-dasharray': '10,5'
            },
            geometry: {
              type: 'LineString',
              coordinates: [routeEndCoords, shelterCoords]
            }
          } as import('geojson').Feature);
        }
        
        // 4b. 避难所标记
        features.push({
          type: 'Feature',
          properties: { 
            id: 'end-marker',
            title: nearestShelter.name,
            type: 'end',
            icon: 'home',
            color: '#67C23A',
            size: 'large',
            shelterCapacity: nearestShelter.capacity
          },
          geometry: {
            type: 'Point',
            coordinates: shelterCoords
          }
        } as import('geojson').Feature);
      }
    } else if (routes.length > 0) {
      // 如果没有计算路径，显示最新的用户路径（带完整标记）
      const userRoute = routes.find(r => (r as any).is_user_generated === true);
      if (userRoute) {
        const geometry = (userRoute as any).route_geometry || (userRoute as any).geometry;
        if (geometry && geometry.type === 'LineString' && geometry.coordinates) {
          const routeCoords = geometry.coordinates;
          const routeStart = routeCoords[0];
          const routeEnd = routeCoords[routeCoords.length - 1];
          
          // 添加起点连接线
          if (location) {
            const userCoords = [location.longitude, location.latitude];
            const distanceToStart = Math.sqrt(
              Math.pow(userCoords[0] - routeStart[0], 2) + 
              Math.pow(userCoords[1] - routeStart[1], 2)
            ) * 111320;
            
            if (distanceToStart > 50) {
              features.push({
                type: 'Feature',
                properties: { 
                  id: 'history-connect-start',
                  title: '前往路径起点',
                  stroke: '#409EFF',
                  'stroke-width': 3,
                  'stroke-opacity': 0.6,
                  'stroke-dasharray': '10,5'
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [userCoords, routeStart]
                }
              } as import('geojson').Feature);
            }
          }
          
          // 主路径
          features.push({
            type: 'Feature',
            properties: { 
              id: userRoute.id, 
              title: '历史路径', 
              safety: userRoute.safety_score,
              stroke: '#F56C6C',
              'stroke-width': 5,
              'stroke-opacity': 0.9
            },
            geometry: geometry
          } as import('geojson').Feature);
          
          // 添加终点连接线和标记
          const nearestShelter = nearbyShelters.length > 0 ? nearbyShelters[0] : null;
          if (nearestShelter?.location?.coordinates) {
            const shelterCoords = nearestShelter.location.coordinates;
            const distanceToEnd = Math.sqrt(
              Math.pow(routeEnd[0] - shelterCoords[0], 2) + 
              Math.pow(routeEnd[1] - shelterCoords[1], 2)
            ) * 111320;
            
            if (distanceToEnd > 50) {
              features.push({
                type: 'Feature',
                properties: { 
                  id: 'history-connect-end',
                  title: '到达避难所',
                  stroke: '#67C23A',
                  'stroke-width': 3,
                  'stroke-opacity': 0.6,
                  'stroke-dasharray': '10,5'
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [routeEnd, shelterCoords]
                }
              } as import('geojson').Feature);
            }
            
            // 避难所标记
            features.push({
              type: 'Feature',
              properties: { 
                id: 'history-end-marker',
                title: nearestShelter.name,
                type: 'end',
                color: '#67C23A'
              },
              geometry: {
                type: 'Point',
                coordinates: shelterCoords
              }
            } as import('geojson').Feature);
          }
        }
      }
    }
    
    return { type: 'FeatureCollection', features } as import('geojson').FeatureCollection;
  }, [routes, calculatedRoute, currentRiskZone, location]);

  const getDifficultyColor = (level?: number) => {
    const map: Record<number, string> = { 1: '#67C23A', 2: '#E6A23C', 3: '#F56C6C' };
    return level ? map[level] || '#909399' : '#909399';
  };

  const getDifficultyText = (level?: number) => {
    const map: Record<number, string> = { 1: '简单', 2: '中等', 3: '困难' };
    return level ? map[level] || '未知' : '未知';
  };

  const getRiskLevelColor = (level?: number) => {
    const colors: Record<number, string> = {
      1: '#67C23A',
      2: '#409EFF',
      3: '#E6A23C',
      4: '#FA8C16',
      5: '#F56C6C'
    };
    return level ? colors[level] || '#909399' : '#909399';
  };

  return (
    <View style={styles.container}>
      {/* Tab切换 */}
      <SegmentTabs
        tabs={[{ key: 'map', label: '地图视图' }, { key: 'list', label: '历史记录' }]}
        value={mode}
        onChange={(k) => setMode(k as 'list' | 'map')}
      />

      {/* 地图模式：显示控制面板 + 地图 */}
      {mode === 'map' && (
        <>
          {/* 附近避难所推荐 */}
          {nearbyShelters.length > 0 && (
        <View style={styles.shelterRecommend}>
          <View style={styles.shelterHeader}>
            <Ionicons name="home" size={18} color="#67C23A" style={{ marginRight: 6 }} />
            <Text style={styles.shelterTitle}>最近避难所 ({nearbyShelters.length})</Text>
          </View>
          <View style={styles.shelterList}>
            {nearbyShelters.map((shelter, index) => (
              <View key={shelter.id} style={styles.shelterItem}>
                <View style={styles.shelterRank}>
                  <Text style={styles.shelterRankText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shelterName}>{shelter.name}</Text>
                  <Text style={styles.shelterCapacity}>容量: {shelter.capacity}人</Text>
                </View>
                <TouchableOpacity 
                  style={styles.shelterNavButton}
                  onPress={() => {
                    if (shelter.location && location) {
                      const [lng, lat] = shelter.location.coordinates;
                      handleSmartRoute();
                    }
                  }}
                >
                  <Ionicons name="navigate" size={18} color="#409EFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
          )}

          {/* 智能路径规划控制面板 */}
          {location && (
        <View style={styles.smartPanel}>
          <Text style={styles.panelTitle}>智能路径规划 (A*算法)</Text>
          
          <View style={styles.routeTypeSelector}>
            {[
              { key: 'safest', label: '最安全', icon: 'shield-checkmark-outline', color: '#67C23A' },
              { key: 'fastest', label: '最快', icon: 'rocket-outline', color: '#E6A23C' },
              { key: 'shortest', label: '最短', icon: 'resize-outline', color: '#409EFF' }
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.routeTypeButton,
                  routeType === type.key && { backgroundColor: type.color, borderColor: type.color }
                ]}
                onPress={() => setRouteType(type.key as any)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={18} 
                  color={routeType === type.key ? '#FFFFFF' : type.color}
                />
                <Text style={[
                  styles.routeTypeText,
                  routeType === type.key && { color: '#FFFFFF' }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.calculateButton, calculating && styles.calculateButtonDisabled]}
            onPress={handleSmartRoute}
            disabled={calculating}
          >
            {calculating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.calculateButtonText}>计算中...</Text>
              </>
            ) : (
              <>
                <Ionicons name="navigate-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.calculateButtonText}>计算最优路径</Text>
              </>
            )}
          </TouchableOpacity>

          {calculatedRoute && (
            <>
              <View style={styles.routeInfoCard}>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="resize-outline" size={16} color="#409EFF" style={{ marginRight: 6 }} />
                  <Text style={styles.routeInfoLabel}>距离:</Text>
                  <Text style={styles.routeInfoValue}>
                    {(calculatedRoute.totalDistance / 1000).toFixed(2)} 公里
                  </Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="time-outline" size={16} color="#409EFF" style={{ marginRight: 6 }} />
                  <Text style={styles.routeInfoLabel}>时间:</Text>
                  <Text style={styles.routeInfoValue}>
                    {calculatedRoute.estimatedTime} 分钟
                  </Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#67C23A" style={{ marginRight: 6 }} />
                  <Text style={styles.routeInfoLabel}>安全:</Text>
                  <Text style={[styles.routeInfoValue, { color: '#67C23A', fontWeight: '700' }]}>
                    {calculatedRoute.safetyScore}/5
                  </Text>
                </View>
              </View>
              
              {/* 开始导航按钮 */}
              {nearbyShelters.length > 0 && (
                <TouchableOpacity 
                  style={styles.startNavButton}
                  onPress={() => {
                    const shelter = nearbyShelters[0];
                    if (shelter.location?.coordinates) {
                      // 传递完整的路径数据
                      (navigation as any).navigate('Navigation', {
                        destination: {
                          lat: shelter.location.coordinates[1],
                          lng: shelter.location.coordinates[0],
                          name: shelter.name
                        },
                        routeId: calculatedRoute.route.id,
                        routeGeometry: calculatedRoute.route.route_geometry // 传递路径几何
                      });
                    }
                  }}
                >
                  <LinearGradient colors={['#67C23A', '#85CE61']} style={styles.startNavGradient}>
                    <Ionicons name="navigate" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.startNavText}>开始导航</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
          )}

          {/* 地图显示区域 */}
          {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#409EFF" /></View>
        ) : !location ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={64} color="#DCDFE6" />
            <Text style={styles.emptyText}>需要位置权限</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={loadLocation}>
              <Ionicons name="location" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyButtonText}>授予权限</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, position: 'relative' }}>
            <MapContainer geojson={geojson} />
            
            {/* 计算中的动画覆盖层 */}
            {calculating && (
              <View style={styles.calculatingOverlay}>
                <View style={styles.calculatingCard}>
                  <ActivityIndicator size="large" color="#409EFF" />
                  <Text style={styles.calculatingTitle}>智能路径规划中</Text>
                  <Text style={styles.calculatingStage}>{calculatingStage}</Text>
                  <View style={styles.calculatingSteps}>
                    <View style={styles.stepDot} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
        </>
      )}

      {/* 历史记录模式：显示用户的路径历史 */}
      {mode === 'list' && (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.loading}><ActivityIndicator size="large" color="#409EFF" /></View>
          ) : routes.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={64} color="#DCDFE6" />
              <Text style={styles.emptyText}>暂无历史记录</Text>
              <Text style={styles.emptyHint}>计算路径后会自动保存历史</Text>
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={() => {
                  setMode('map');
                }}
              >
                <Ionicons name="navigate-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyButtonText}>开始规划</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.historyHeader}>
                <Ionicons name="time" size={20} color="#409EFF" style={{ marginRight: 8 }} />
                <Text style={styles.historyTitle}>路径规划历史</Text>
                <Text style={styles.historyCount}>共{routes.length}条</Text>
              </View>
            <FlatList
              data={routes}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isUserRoute = (item as any).is_user_generated === true;
                  
                  return (
                    <TouchableOpacity 
                      style={styles.routeCard}
                      onPress={() => {
                        // 还原这条路径到地图
                        console.log('[HISTORY] 还原历史路径:', item.id, {
                          hasRouteGeometry: !!(item as any).route_geometry,
                          hasStartPoint: !!(item as any).start_point,
                          hasEndPoint: !!(item as any).end_point,
                          geometryType: (item as any).route_geometry?.type,
                          pointCount: (item as any).route_geometry?.coordinates?.length
                        });
                        
                        // 构建路径结果对象
                        const restoredRoute: RouteCalculationResult = {
                          route: item,
                          estimatedTime: item.estimated_time_minutes || 0,
                          totalDistance: item.distance_meters || 0,
                          safetyScore: item.safety_score || 0,
                          warnings: []
                        };
                        
                        setCalculatedRoute(restoredRoute);
                        setMode('map');
                        
                        // 如果避难所数据还没加载，立即加载
                        if (location && nearbyShelters.length === 0) {
                          console.log('[HISTORY] 重新加载避难所数据');
                          checkRiskZoneAndShelters(location.longitude, location.latitude);
                        }
                        
                        console.log('[HISTORY] calculatedRoute已设置，等待地图刷新');
                        
                        Alert.alert(
                          '历史路径',
                          `已还原此路径\n\n` +
                          `距离: ${((item.distance_meters || 0) / 1000).toFixed(2)}公里\n` +
                          `时间: ${item.estimated_time_minutes || 0}分钟\n` +
                          `安全评分: ${item.safety_score || 0}/5`,
                          [{ text: '查看地图' }]
                        );
                      }}
                    >
                  <LinearGradient
                        colors={isUserRoute ? ['#F56C6C', '#FA8C16', '#FF6B6B'] : ['#667EEA', '#764BA2', '#8B5CF6']}
                    style={styles.cardGradient}
                  >
                        {isUserRoute && (
                          <View style={styles.smartBadge}>
                            <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.smartBadgeText}>智能路径 (A*)</Text>
                          </View>
                        )}
                        
                    <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.routeName}>
                              {isUserRoute ? '我的撤离路线' : (item.route_id || `路线 #${item.id}`)}
                            </Text>
                            {item.created_at && (
                              <Text style={styles.routeTime}>
                                {new Date(item.created_at).toLocaleString('zh-CN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            )}
                          </View>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty_level ?? undefined) }]}>
                        <Text style={styles.difficultyText}>{getDifficultyText(item.difficulty_level ?? undefined)}</Text>
                      </View>
                    </View>

                    <View style={styles.routeStats}>
                      <View style={styles.statItem}>
                          <Ionicons name="resize-outline" size={24} color="rgba(255,255,255,0.9)" style={{ marginRight: 12 }} />
                        <View>
                          <Text style={styles.statLabel}>距离</Text>
                          <Text style={styles.statValue}>
                            {item.distance_meters ? `${(item.distance_meters / 1000).toFixed(1)} km` : '-'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.statItem}>
                          <Ionicons name="time-outline" size={24} color="rgba(255,255,255,0.9)" style={{ marginRight: 12 }} />
                        <View>
                          <Text style={styles.statLabel}>预计时间</Text>
                          <Text style={styles.statValue}>{item.estimated_time_minutes || '-'} 分钟</Text>
                        </View>
                      </View>

                      <View style={styles.statItem}>
                          <Ionicons name="shield-checkmark-outline" size={24} color="rgba(255,255,255,0.9)" style={{ marginRight: 12 }} />
                        <View>
                          <Text style={styles.statLabel}>安全评分</Text>
                          <Text style={styles.statValue}>{item.safety_score || '-'}</Text>
                        </View>
                      </View>
                    </View>

                      {isUserRoute && (item as any).warnings && (
                        <View style={styles.warningBox}>
                          <Ionicons name="warning-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.warningText}>
                            {typeof (item as any).warnings === 'string' 
                              ? (item as any).warnings 
                              : Array.isArray((item as any).warnings) && (item as any).warnings[0]
                            }
                          </Text>
                </View>
              )}
                      
                      <View style={styles.clickHint}>
                        <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 4 }} />
                        <Text style={styles.clickHintText}>点击查看地图</Text>
                      </View>
                    </LinearGradient>
                    </TouchableOpacity>
                );
              }}
            />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, color: '#909399', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: '#C0C4CC', marginBottom: 24, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#409EFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  
  historyHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E4E7ED' },
  historyTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#303133' },
  historyCount: { fontSize: 13, color: '#909399', fontWeight: '600' },
  
  shelterRecommend: { backgroundColor: '#F0FAF0', margin: 16, marginBottom: 0, padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#67C23A' },
  shelterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  shelterTitle: { fontSize: 14, fontWeight: '700', color: '#67C23A' },
  shelterList: { gap: 8 },
  shelterItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  shelterRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#67C23A', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  shelterRankText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  shelterName: { fontSize: 14, fontWeight: '600', color: '#303133', marginBottom: 2 },
  shelterCapacity: { fontSize: 12, color: '#909399' },
  shelterNavButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  
  smartPanel: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E4E7ED' },
  panelTitle: { fontSize: 15, fontWeight: '700', color: '#303133', marginBottom: 12 },
  routeTypeSelector: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  routeTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DCDFE6', backgroundColor: '#FFFFFF' },
  routeTypeText: { fontSize: 13, fontWeight: '600', color: '#606266', marginLeft: 4 },
  calculateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#409EFF', paddingVertical: 14, borderRadius: 8 },
  calculateButtonDisabled: { backgroundColor: '#A0CFFF' },
  calculateButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  routeInfoCard: { marginTop: 12, backgroundColor: '#F0F5FF', borderRadius: 8, padding: 12, borderLeftWidth: 4, borderLeftColor: '#409EFF' },
  routeInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeInfoLabel: { fontSize: 14, color: '#606266', marginLeft: 6, marginRight: 8 },
  routeInfoValue: { fontSize: 14, fontWeight: '700', color: '#303133' },
  
  startNavButton: { marginTop: 12, borderRadius: 8, overflow: 'hidden' },
  startNavGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  startNavText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  
  smartBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 12 },
  smartBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 8, marginTop: 12 },
  warningText: { flex: 1, fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  clickHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  clickHintText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  
  calculatingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  calculatingCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10, minWidth: 280 },
  calculatingTitle: { fontSize: 18, fontWeight: '800', color: '#303133', marginTop: 16, marginBottom: 8 },
  calculatingStage: { fontSize: 14, color: '#409EFF', fontWeight: '600', marginBottom: 20 },
  calculatingSteps: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#409EFF' },
  stepLine: { width: 30, height: 2, backgroundColor: '#E4E7ED', marginHorizontal: 4 },
  
  listContent: { padding: 16 },
  routeCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  cardGradient: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  routeName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  routeTime: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  difficultyText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  routeStats: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, padding: 12, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  description: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 19 },
});