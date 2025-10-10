import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapContainer from '../components/MapContainer';

export default function NavigationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as any;
  
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [distance, setDistance] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [navigationInstruction, setNavigationInstruction] = useState('准备导航...');
  const [remainingTime, setRemainingTime] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);

  useEffect(() => {
    loadLocationAndDestination();
  }, []);

  // 实时GPS追踪
  useEffect(() => {
    if (!isNavigating || !location || !destination) return;

    const interval = setInterval(async () => {
      await updateGPSLocation();
    }, 3000); // 每3秒更新一次

    return () => clearInterval(interval);
  }, [isNavigating, location, destination]);

  const loadLocationAndDestination = async () => {
    // 获取当前位置
    const testModeValue = await AsyncStorage.getItem('testMode');
    const isTestMode = testModeValue === 'true';
    
    if (isTestMode) {
      setLocation({
        latitude: 40.02713505455811,
        longitude: 116.20168232062399
      });
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    }

    // 获取目标地点
    if (params?.destination) {
      setDestination(params.destination);
    }
    
    // 获取路径ID和几何数据
    if (params?.routeId) {
      setRouteId(params.routeId);
      // 从后端获取完整路径
      await loadRouteGeometry(params.routeId);
    } else if (params?.routeGeometry) {
      // 直接使用传入的路径几何
      setRouteGeometry(params.routeGeometry);
    }
    
    // 自动开始导航
    setIsNavigating(true);
  };

  // 加载路径几何数据
  const loadRouteGeometry = async (routeId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/routes/${routeId}`);
      const result = await response.json();
      
      if (result.success && result.data?.route_geometry) {
        setRouteGeometry(result.data.route_geometry);
        console.log('[NAV] 路径几何已加载，共', result.data.route_geometry.coordinates?.length, '个节点');
      }
    } catch (error) {
      console.error('加载路径几何失败:', error);
    }
  };

  // 更新GPS位置并获取导航指令
  const updateGPSLocation = async () => {
    try {
      const testModeValue = await AsyncStorage.getItem('testMode');
      const isTestMode = testModeValue === 'true';
      
      let currentLoc;
      if (isTestMode) {
        // 测试模式：模拟移动（每次靠近目标一点点）
        if (location && destination) {
          const progress = 0.05; // 每次移动5%
          currentLoc = {
            latitude: location.latitude + (destination.lat - location.latitude) * progress,
            longitude: location.longitude + (destination.lng - location.longitude) * progress
          };
          console.log('[NAV-TEST] 模拟移动到:', currentLoc);
        } else {
          return;
        }
      } else {
        // 真实GPS：实时获取设备位置
        console.log('[NAV-GPS] 获取真实GPS位置...');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 10 // 移动10米以上才更新
        });
        currentLoc = { 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        };
        console.log('[NAV-GPS] GPS位置已更新:', currentLoc);
      }
      
      // 更新位置（地图上的蓝色点会实时移动）
      setLocation(currentLoc);
      
      // 如果有路径ID，调用后端获取导航状态
      if (routeId && destination) {
        await updateNavigationStatus(currentLoc, routeId);
      } else {
        // 简单模式：只计算直线距离和方向
        updateSimpleNavigation(currentLoc);
      }
      
      // 检查是否到达
      if (destination) {
        const dist = calculateDistance(
          currentLoc.latitude,
          currentLoc.longitude,
          destination.lat,
          destination.lng
        );
        
        if (dist < 50) { // 50米内视为到达
          setIsNavigating(false);
          Alert.alert(
            '已到达目的地',
            `欢迎来到${destination.name}`,
            [{ text: '结束导航', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      console.error('更新GPS失败:', error);
    }
  };

  // 调用后端API更新导航状态
  const updateNavigationStatus = async (currentLoc: { latitude: number; longitude: number }, routeId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/routes/${routeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLocation: {
            type: 'Point',
            coordinates: [currentLoc.longitude, currentLoc.latitude]
          }
        })
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        setDistance(result.data.remainingDistance);
        setRemainingTime(result.data.remainingTime);
        setNavigationInstruction(result.data.nextInstruction);
        
        // 如果需要重新规划
        if (result.data.needsRerouting) {
          Alert.alert('路径偏离', '您已偏离规划路径，是否重新规划？', [
            { text: '取消', style: 'cancel' },
            { text: '重新规划', onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (error) {
      console.error('更新导航状态失败:', error);
      updateSimpleNavigation(currentLoc);
    }
  };

  // 简单导航（不依赖后端）
  const updateSimpleNavigation = (currentLoc: { latitude: number; longitude: number }) => {
    if (!destination) return;
    
    const dist = calculateDistance(
      currentLoc.latitude,
      currentLoc.longitude,
      destination.lat,
      destination.lng
    );
    
    setDistance(dist);
    
    if (dist < 100) {
      setNavigationInstruction('即将到达目的地');
    } else if (dist < 500) {
      setNavigationInstruction(`继续前行 ${Math.round(dist)} 米`);
    } else {
      setNavigationInstruction(`前往目标 ${(dist / 1000).toFixed(1)} 公里`);
    }
    
    setRemainingTime(Math.round(dist / 80)); // 步行速度80米/分钟
  };

  useEffect(() => {
    if (location && destination) {
      // 计算距离和方位
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        destination.lat,
        destination.lng
      );
      setDistance(dist);

      const bear = calculateBearing(
        location.latitude,
        location.longitude,
        destination.lat,
        destination.lng
      );
      setBearing(bear);
    }
  }, [location, destination]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  const getDirection = (bearing: number): string => {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const geojson = React.useMemo(() => {
    const features: any[] = [];
    
    // 1. 显示完整的规划路径（如果有）
    if (routeGeometry && routeGeometry.type === 'LineString' && routeGeometry.coordinates) {
      const routeCoords = routeGeometry.coordinates;
      const routeStart = routeCoords[0];
      const routeEnd = routeCoords[routeCoords.length - 1];
      
      // 1a. 当前位置到路径起点的连接线（蓝色虚线）
      if (location) {
        const userCoords = [location.longitude, location.latitude];
        features.push({
          type: 'Feature',
          properties: { 
            id: 'connect-to-route',
            title: '前往路径起点',
            stroke: '#409EFF',
            'stroke-width': 4,
            'stroke-opacity': 0.7,
            'stroke-dasharray': '10,5'
          },
          geometry: {
            type: 'LineString',
            coordinates: [userCoords, routeStart]
          }
        });
      }
      
      // 1b. 规划路径主体（红色粗线）
      features.push({
        type: 'Feature',
        properties: { 
          id: 'planned-route',
          title: '规划路径',
          stroke: '#F56C6C',
          'stroke-width': 6,
          'stroke-opacity': 0.95
        },
        geometry: routeGeometry
      });
      
      // 1c. 路径终点到目标的连接线（绿色虚线）
      if (destination) {
        features.push({
          type: 'Feature',
          properties: { 
            id: 'connect-to-destination',
            title: '到达目标',
            stroke: '#67C23A',
            'stroke-width': 4,
            'stroke-opacity': 0.7,
            'stroke-dasharray': '10,5'
          },
          geometry: {
            type: 'LineString',
            coordinates: [routeEnd, [destination.lng, destination.lat]]
          }
        });
      }
    } else if (location && destination) {
      // 2. 如果没有路径几何，显示直线（降级）
      features.push({
        type: 'Feature',
        properties: { 
          id: 'direct-line',
          title: '直线方向',
          stroke: '#409EFF',
          'stroke-width': 3,
          'stroke-opacity': 0.6,
          'stroke-dasharray': '10,5'
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [location.longitude, location.latitude],
            [destination.lng, destination.lat]
          ]
        }
      });
    }
    
    // 3. 起点标记（当前位置）
    if (location) {
      features.push({
        type: 'Feature',
        properties: { 
          id: 'current-location',
          title: '我的位置',
          type: 'start'
        },
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        }
      });
    }
    
    // 4. 终点标记
    if (destination) {
      features.push({
        type: 'Feature',
        properties: { 
          id: 'destination',
          title: destination.name,
          type: 'end'
        },
        geometry: {
          type: 'Point',
          coordinates: [destination.lng, destination.lat]
        }
      });
    }
    
    return { type: 'FeatureCollection', features };
  }, [location, destination, routeGeometry]);

  return (
    <View style={styles.container}>
      {/* 顶部信息卡片 */}
      <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>实时导航</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.destinationInfo}>
          <Ionicons name="location" size={32} color="#FFFFFF" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.destinationName}>{destination?.name || '目标位置'}</Text>
            <Text style={styles.destinationHint}>正在为您导航</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 导航指令卡片 */}
      <View style={styles.instructionCard}>
        <Ionicons name="arrow-forward-circle" size={32} color="#409EFF" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.instructionText}>{navigationInstruction}</Text>
          {remainingTime > 0 && (
            <Text style={styles.remainingTime}>预计 {remainingTime} 分钟后到达</Text>
          )}
        </View>
      </View>

      {/* 导航信息 */}
      <View style={styles.navInfo}>
        <View style={styles.distanceCard}>
          <Ionicons name="resize-outline" size={48} color="#409EFF" />
          <Text style={styles.distanceValue}>{(distance / 1000).toFixed(2)}</Text>
          <Text style={styles.distanceUnit}>公里</Text>
        </View>

        <View style={styles.directionCard}>
          <Ionicons 
            name="navigate-circle" 
            size={64} 
            color="#67C23A" 
            style={{ transform: [{ rotate: `${bearing}deg` }] }}
          />
          <Text style={styles.directionText}>{getDirection(bearing)}</Text>
          <Text style={styles.bearingText}>{Math.round(bearing)}°</Text>
        </View>
      </View>

      {/* 地图 */}
      <View style={styles.mapContainer}>
        {location && destination && <MapContainer geojson={geojson as any} />}
      </View>

      {/* 底部操作 */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('[NAV] 用户结束导航');
            setIsNavigating(false); // 停止GPS追踪
            navigation.goBack(); // 返回上一页
          }}
        >
          <Ionicons name="close-circle-outline" size={24} color="#909399" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>结束导航</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingTop: 16, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  destinationInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  destinationName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  destinationHint: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  
  instructionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  instructionText: { fontSize: 18, fontWeight: '700', color: '#303133', marginBottom: 4 },
  remainingTime: { fontSize: 13, color: '#67C23A', fontWeight: '600' },
  
  navInfo: { flexDirection: 'row', padding: 16, gap: 12 },
  distanceCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  distanceValue: { fontSize: 36, fontWeight: '900', color: '#409EFF', marginTop: 8 },
  distanceUnit: { fontSize: 14, color: '#909399', marginTop: 4 },
  directionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  directionText: { fontSize: 20, fontWeight: '800', color: '#303133', marginTop: 12 },
  bearingText: { fontSize: 13, color: '#909399', marginTop: 4 },
  
  mapContainer: { flex: 1, margin: 16, marginTop: 0, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  
  actions: { padding: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#DCDFE6' },
  actionText: { fontSize: 15, fontWeight: '600', color: '#606266' },
});

