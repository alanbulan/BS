import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getActiveShelters, getNearbyShelters, Shelter } from '../api/shelters';

export default function SheltersScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [calculatingFor, setCalculatingFor] = useState<string>('');

  useEffect(() => {
    loadLocation();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Ionicons name="home-outline" size={16} color="#67C23A" style={{ marginRight: 4 }} />
            <Text style={styles.headerBadgeText}>{shelters.length} 避难所</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, shelters.length]);

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
        loadShelters(testLocation.latitude, testLocation.longitude);
        return;
      }
      
      // 正常模式：使用真实GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        loadShelters(loc.coords.latitude, loc.coords.longitude);
      } else {
        loadShelters();
      }
    } catch (error) {
      console.error('加载位置失败:', error);
      loadShelters();
    }
  };

  const loadShelters = async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      console.log('加载避难所，参数:', { lat, lng });
      const data = lat && lng 
        ? await getNearbyShelters(lat, lng, 50000)  // 50公里 = 50000米
        : await getActiveShelters();
      console.log(`加载到 ${data?.length || 0} 个避难所`, data?.slice(0, 3).map(s => s.name));
      setShelters(data || []);
    } catch (error) {
      console.error('加载避难所失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    location ? await loadShelters(location.latitude, location.longitude) : await loadShelters();
    setRefreshing(false);
  };

  const navigateTo = async (shelter: Shelter) => {
    if (!shelter.location?.coordinates) {
      if (Platform.OS === 'web') {
        window.alert('该避难所暂无位置信息');
      } else {
        Alert.alert('提示', '该避难所暂无位置信息');
      }
      return;
    }
    
    if (!location) {
      if (Platform.OS === 'web') {
        window.alert('需要位置信息才能导航');
      } else {
        Alert.alert('提示', '需要位置信息才能导航');
      }
      return;
    }
    
    const [lng, lat] = shelter.location.coordinates;
    
    // 显示加载动画
    setCalculatingRoute(true);
    setCalculatingFor(shelter.name);
    console.log('[NAV] 正在规划路径到', shelter.name);
    
    try {
      // 调用路径计算API
      const response = await fetch('http://localhost:3000/api/v1/routes/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startPoint: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          endPoint: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          routeType: 'safest',
          avoidHighRiskZones: true,
          maxDistance: 50,
          transportMode: 'walking'
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('[NAV] 路径计算成功，距离:', result.data.totalDistance, '米');
        
        // Web平台直接跳转，移动端弹窗确认
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(
            `路径规划完成\n距离: ${(result.data.totalDistance / 1000).toFixed(2)}公里\n时间: ${result.data.estimatedTime}分钟\n\n是否开始导航？`
          );
          
          if (confirmed) {
            (navigation as any).navigate('Navigation', {
              destination: {
                lat: lat,
                lng: lng,
                name: shelter.name
              },
              routeId: result.data.route.id,
              routeGeometry: result.data.route.route_geometry
            });
          }
        } else {
          // 移动端使用Alert
          Alert.alert(
            '路径规划完成',
            `距离: ${(result.data.totalDistance / 1000).toFixed(2)}公里\n时间: ${result.data.estimatedTime}分钟`,
            [
              { 
                text: '开始导航', 
                onPress: () => {
                  (navigation as any).navigate('Navigation', {
                    destination: {
                      lat: lat,
                      lng: lng,
                      name: shelter.name
                    },
                    routeId: result.data.route.id,
                    routeGeometry: result.data.route.route_geometry
                  });
                }
              },
              { text: '取消', style: 'cancel' }
            ]
          );
        }
      } else {
        throw new Error('路径计算失败');
      }
    } catch (error) {
      console.error('[NAV] 计算路径失败:', error);
      if (Platform.OS === 'web') {
        window.alert('路径计算失败，请重试');
      } else {
        Alert.alert('计算失败', '无法规划路径，请重试');
      }
    } finally {
      setCalculatingRoute(false);
      setCalculatingFor('');
    }
  };

  return (
    <View style={styles.container}>
      {loading && shelters.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#409EFF" />
        </View>
        ) : shelters.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="home-outline" size={64} color="#DCDFE6" />
          <Text style={styles.emptyText}>附近暂无避难所</Text>
        </View>
      ) : (
        <FlatList
          data={shelters}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const available = item.capacity - (item.current_occupancy || 0);
            const rate = item.current_occupancy ? ((item.current_occupancy / item.capacity) * 100).toFixed(0) : '0';
            
            return (
              <View style={styles.card}>
                <LinearGradient
                  colors={item.is_active ? ['#FFFFFF', '#F0FAF0'] : ['#FFFFFF', '#F5F5F5']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.shelterName}>{item.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#67C23A' : '#909399' }]}>
                      <Text style={styles.statusText}>{item.is_active ? '开放' : '关闭'}</Text>
                    </View>
                  </View>

                  {item.address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Ionicons name="location-outline" size={14} color="#606266" style={{ marginRight: 4 }} />
                      <Text style={styles.address}>{item.address}</Text>
                    </View>
                  )}

                  <View style={styles.capacityBox}>
                    <View style={styles.capacityRow}>
                      <Text style={styles.capacityLabel}>总容量</Text>
                      <Text style={styles.capacityValue}>{item.capacity}人</Text>
                    </View>
                    <View style={styles.capacityRow}>
                      <Text style={styles.capacityLabel}>已入住</Text>
                      <Text style={styles.capacityValue}>{item.current_occupancy || 0}人</Text>
                    </View>
                    <View style={styles.capacityRow}>
                      <Text style={styles.capacityLabel}>剩余</Text>
                      <Text style={[styles.capacityValue, { color: available > 100 ? '#67C23A' : '#E6A23C' }]}>{available}人</Text>
                    </View>
                  </View>

                  <View style={styles.progressBar}>
                    <View style={styles.progressBg}>
                      <View style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(Number(rate), 100)}%`,
                          backgroundColor: Number(rate) < 70 ? '#67C23A' : Number(rate) < 90 ? '#E6A23C' : '#F56C6C'
                        }
                      ]} />
                    </View>
                    <Text style={styles.progressText}>{rate}%</Text>
                  </View>

                  <TouchableOpacity style={styles.navButton} onPress={() => navigateTo(item)}>
                    <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.navGradient}>
                      <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.navText}>导航到这里</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            );
          }}
        />
      )}

      {/* 路径计算加载覆盖层 */}
      {calculatingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#409EFF" />
            <Text style={styles.loadingTitle}>正在规划路径</Text>
            <Text style={styles.loadingDesc}>前往 {calculatingFor}</Text>
            <Text style={styles.loadingHint}>使用A*算法计算最优路径...</Text>
            <View style={styles.loadingSteps}>
              <View style={styles.loadingDot} />
              <View style={styles.loadingLine} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingLine} />
              <View style={styles.loadingDot} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerRight: { paddingRight: 12 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  headerBadgeText: { color: '#67C23A', fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#909399', marginTop: 16 },
  listContent: { padding: 16 },
  card: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardGradient: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shelterName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#303133', marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  address: { fontSize: 14, color: '#606266', marginBottom: 12 },
  capacityBox: { backgroundColor: '#F5F7FA', borderRadius: 8, padding: 12, marginBottom: 12 },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  capacityLabel: { fontSize: 13, color: '#909399' },
  capacityValue: { fontSize: 13, fontWeight: '700', color: '#303133' },
  progressBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#E4E7ED', borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#909399', width: 40, textAlign: 'right' },
  navButton: { borderRadius: 8, overflow: 'hidden' },
  navGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  navText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', minWidth: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: '#303133', marginTop: 16, marginBottom: 8 },
  loadingDesc: { fontSize: 15, color: '#409EFF', fontWeight: '600', marginBottom: 4 },
  loadingHint: { fontSize: 13, color: '#909399', marginBottom: 20 },
  loadingSteps: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  loadingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#409EFF' },
  loadingLine: { width: 30, height: 2, backgroundColor: '#E4E7ED', marginHorizontal: 4 },
});