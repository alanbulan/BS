import React, { useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SegmentTabs from '../components/SegmentTabs';
import MapContainer from '../components/MapContainer';
import { listStations, listMonitoringData, MonitoringStation, MonitoringDataPoint } from '../api/monitoring';

export default function MonitoringScreen() {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [monitoringData, setMonitoringData] = useState<MonitoringDataPoint[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Ionicons name="stats-chart" size={16} color="#667EEA" style={{ marginRight: 4 }} />
            <Text style={styles.headerBadgeText}>{stations.length} 站点</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, stations.length]);

  const loadStations = async () => {
    setLoading(true);
    try {
      // 使用API client（带认证token），获取所有监测站
      const raw: unknown = await listStations({ activeOnly: true, limit: 1000 });
      
      let arr: any[] = [];
      if (Array.isArray(raw)) {
        arr = raw;
      } else if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (Array.isArray(obj.items)) arr = obj.items as any[];
        else if (Array.isArray(obj.data)) arr = obj.data as any[];
        else if (Array.isArray(obj.results)) arr = obj.results as any[];
      }
      
      console.log(`[监测站] 成功加载 ${arr.length} 个监测站`);
      setStations(arr as MonitoringStation[]);
    } catch (error) {
      console.error('加载监测站失败:', error);
      Alert.alert('错误', '加载监测站失败');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStations();
    if (selectedStation) {
      await loadStationData(selectedStation);
    }
    setRefreshing(false);
  };

  const loadStationData = async (station: MonitoringStation) => {
    setDataLoading(true);
    try {
      const data = await listMonitoringData({ 
        station_id: station.station_id || String(station.id), 
        limit: 50 
      });
      setMonitoringData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载监测数据失败:', error);
      setMonitoringData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleStationPress = (station: MonitoringStation) => {
    setSelectedStation(station);
    loadStationData(station);
  };

  const getStationTypeColor = (type?: string): [string, string, ...string[]] => {
    const typeMap: Record<string, [string, string, ...string[]]> = {
      'rainfall': ['#2196F3', '#42A5F5', '#64B5F6'],
      'water_level': ['#00BCD4', '#26C6DA', '#4DD0E1'],
      'landslide': ['#FF9800', '#FFA726', '#FFB74D'],
      'earthquake': ['#F44336', '#EF5350', '#E57373'],
      'temperature': ['#9C27B0', '#AB47BC', '#BA68C8'],
    };
    return typeMap[type || ''] || ['#607D8B', '#78909C', '#90A4AE'];
  };

  const getDataTypeIcon = (type?: string): { name: any; color: string } => {
    const iconMap: Record<string, { name: any; color: string }> = {
      'rainfall': { name: 'rainy', color: '#2196F3' },
      'water_level': { name: 'water', color: '#00BCD4' },
      'temperature': { name: 'thermometer', color: '#FF5722' },
      'humidity': { name: 'cloudy', color: '#607D8B' },
      'pressure': { name: 'speedometer', color: '#9C27B0' },
      'displacement': { name: 'move', color: '#FF9800' },
      'wind_speed': { name: 'flag', color: '#4CAF50' },
      'flow_rate': { name: 'trending-up', color: '#00BCD4' },
    };
    return iconMap[type || ''] || { name: 'analytics', color: '#667EEA' };
  };

  const getDataTypeName = (type?: string) => {
    const nameMap: Record<string, string> = {
      'rainfall': '降雨量',
      'water_level': '水位',
      'temperature': '温度',
      'humidity': '湿度',
      'pressure': '气压',
      'displacement': '位移',
      'wind_speed': '风速',
      'flow_rate': '流量',
    };
    return nameMap[type || ''] || type || '未知';
  };

  const formatValue = (value: number, unit?: string) => {
    // 格式化数值，保留合理的小数位
    let formatted = value.toFixed(2);
    // 移除无意义的尾随零
    formatted = formatted.replace(/\.?0+$/, '');
    return formatted;
  };

  // 构建监测站点GeoJSON（使用自定义样式）
  const geojson = useMemo(() => {
    const features = stations.map(s => {
      let lat: number | undefined;
      let lng: number | undefined;
      
      // 尝试多种可能的坐标格式
      if (s.location?.coordinates && Array.isArray(s.location.coordinates)) {
        [lng, lat] = s.location.coordinates;
      } else if ((s as any).longitude !== undefined && (s as any).latitude !== undefined) {
        lng = (s as any).longitude;
        lat = (s as any).latitude;
      } else if ((s as any).lng !== undefined && (s as any).lat !== undefined) {
        lng = (s as any).lng;
        lat = (s as any).lat;
      }
      
      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        return null;
      }
      
      const isActive = s.is_active !== false;
      
      return {
        type: 'Feature',
        properties: {
          id: s.id,
          title: s.name || `站点#${s.id}`,
          stationType: s.station_type,
          isActive: isActive,
          color: isActive ? '#667EEA' : '#909399',
          type: 'monitoring-station'
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      } as import('geojson').Feature;
    }).filter(Boolean) as import('geojson').Feature[];
    
    return { type: 'FeatureCollection', features } as import('geojson').FeatureCollection;
  }, [stations]);

  if (!selectedStation) {
    return (
      <View style={styles.container}>
        <SegmentTabs
          tabs={[
            { key: 'map', label: '地图视图' },
            { key: 'list', label: '列表视图' }
          ]}
          value={viewMode}
          onChange={(k) => setViewMode(k as 'map' | 'list')}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#409EFF" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : stations.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="stats-chart-outline" size={64} color="#DCDFE6" />
            <Text style={styles.emptyText}>暂无活跃监测站</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={loadStations}>
              <Ionicons name="reload-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyButtonText}>重新加载</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'map' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.mapContainer}>
              <MapContainer geojson={geojson as any} />
            </View>
            <View style={styles.stationListOverlay}>
              <Text style={styles.overlayTitle}>监测站列表</Text>
              <FlatList
                data={stations.slice(0, 5)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.miniCard}
                    onPress={() => handleStationPress(item)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={getStationTypeColor((item as any).station_type)}
                      style={styles.miniGradient}
                    >
                      <Text style={styles.miniName} numberOfLines={1}>
                        {item.name || `站点#${item.id}`}
                      </Text>
                      <View style={styles.miniStatus}>
                        <View style={styles.miniDot} />
                        <Text style={styles.miniStatusText}>在线</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setViewMode('list')}
              >
                <Text style={styles.viewAllText}>查看全部 →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={stations}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stationCard}
                onPress={() => handleStationPress(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={getStationTypeColor((item as any).station_type)}
                  style={styles.stationGradient}
                >
                  <View style={styles.stationHeader}>
                    <View style={styles.stationInfo}>
                      <Text style={styles.stationName}>{item.name || `站点 #${item.id}`}</Text>
                      <Text style={styles.stationId}>ID: {item.station_id || item.id}</Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <Ionicons name="radio-button-on" size={12} color="#67C23A" style={{ marginRight: 4 }} />
                      <Text style={styles.activeText}>在线</Text>
                    </View>
                  </View>

                  <View style={styles.stationMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="server-outline" size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 6 }} />
                      <Text style={styles.metaText}>
                        {(item as any).station_type || '通用监测站'}
                      </Text>
                    </View>
                    {(item as any).zone_name && (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 6 }} />
                        <Text style={styles.metaText}>{(item as any).zone_name}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.stationFooter}>
                    <Text style={styles.footerText}>点击查看监测数据</Text>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <LinearGradient
          colors={getStationTypeColor((selectedStation as any).station_type)}
          style={styles.detailHeaderGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedStation(null)}
          >
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          
          <Text style={styles.detailStationName}>
            {selectedStation.name || `站点 #${selectedStation.id}`}
          </Text>
          <Text style={styles.detailStationId}>
            {selectedStation.station_id || selectedStation.id}
          </Text>
          
          <View style={styles.detailMeta}>
            <View style={styles.detailMetaItem}>
              <Ionicons name="server-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.detailMetaText}>
                {(selectedStation as any).station_type || '未知类型'}
              </Text>
            </View>
            {(selectedStation as any).zone_name && (
              <View style={styles.detailMetaItem}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.detailMetaText}>
                  {(selectedStation as any).zone_name}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {dataLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#409EFF" />
          <Text style={styles.loadingText}>加载数据中...</Text>
        </View>
      ) : monitoringData.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={64} color="#DCDFE6" />
          <Text style={styles.emptyText}>暂无监测数据</Text>
          <Text style={styles.emptyHint}>该站点可能尚未开始采集数据</Text>
        </View>
      ) : (
        <FlatList
          data={monitoringData}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item, idx) => `${item.timestamp}-${idx}`}
          contentContainerStyle={styles.dataListContent}
          renderItem={({ item }) => {
            const iconConfig = getDataTypeIcon(item.data_type);
            return (
            <View style={styles.dataCard}>
              <View style={styles.dataCardContent}>
                <View style={[styles.dataIconWrapper, { backgroundColor: iconConfig.color + '15' }]}>
                  <Ionicons name={iconConfig.name} size={28} color={iconConfig.color} />
                </View>
                
                <View style={styles.dataInfo}>
                  <Text style={styles.dataType}>{getDataTypeName(item.data_type)}</Text>
                  <Text style={styles.dataTime}>
                    {new Date(item.timestamp).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  
                  {item.quality_flag !== undefined && (
                    <View style={styles.qualityRow}>
                      <Text style={styles.qualityLabel}>质量: </Text>
                      <View style={[
                        styles.qualityBadge,
                        { backgroundColor: item.quality_flag >= 3 ? '#67C23A' : item.quality_flag >= 2 ? '#E6A23C' : '#F56C6C' }
                      ]}>
                        <Text style={styles.qualityText}>
                          {item.quality_flag >= 3 ? '优秀' : item.quality_flag >= 2 ? '良好' : item.quality_flag >= 1 ? '可用' : '异常'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.dataValueWrapper}>
                  <Text style={styles.dataValue}>{formatValue(item.value)}</Text>
                  {item.unit && (
                    <Text style={styles.dataUnit}>{item.unit}</Text>
                  )}
                </View>
              </View>
            </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerRight: { paddingRight: 12 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F5FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  headerBadgeText: { color: '#667EEA', fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#909399' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#606266', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: '#909399', textAlign: 'center', marginBottom: 24 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#409EFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
  emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  
  mapContainer: { flex: 1, backgroundColor: '#E8F4F8' },
  stationListOverlay: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
  overlayTitle: { fontSize: 16, fontWeight: '700', color: '#303133', paddingHorizontal: 16, marginBottom: 12 },
  horizontalList: { paddingHorizontal: 16, gap: 12 },
  miniCard: { width: 160, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  miniGradient: { padding: 12 },
  miniName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  miniStatus: { flexDirection: 'row', alignItems: 'center' },
  miniDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#67C23A', marginRight: 6 },
  miniStatusText: { fontSize: 11, fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' },
  viewAllButton: { marginTop: 12, marginHorizontal: 16, backgroundColor: '#F0F5FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#409EFF' },
  
  listContent: { padding: 16 },
  stationCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  stationGradient: { padding: 18 },
  stationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  stationInfo: { flex: 1 },
  stationName: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  stationId: { fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  activeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  stationMeta: { marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' },
  stationFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)' },
  footerText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginRight: 4 },
  
  detailHeader: { borderBottomWidth: 1, borderBottomColor: '#E4E7ED' },
  detailHeaderGradient: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 15, color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' },
  detailStationName: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  detailStationId: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600', marginBottom: 14 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  detailMetaText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  
  dataListContent: { padding: 16 },
  dataCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  dataCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dataIconWrapper: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  dataInfo: { flex: 1, marginRight: 12 },
  dataType: { fontSize: 17, fontWeight: '700', color: '#303133', marginBottom: 6 },
  dataTime: { fontSize: 12, color: '#909399', marginBottom: 6 },
  dataValueWrapper: { alignItems: 'flex-end' },
  dataValue: { fontSize: 28, fontWeight: '900', color: '#667EEA', lineHeight: 32 },
  dataUnit: { fontSize: 13, fontWeight: '600', color: '#909399', marginTop: 2 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  qualityLabel: { fontSize: 12, color: '#909399', marginRight: 6 },
  qualityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  qualityText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
