import React, { useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SegmentTabs from '../components/SegmentTabs';
import MapContainer from '../components/MapContainer';
import { listRiskZones, type RiskZone } from '../api/riskZones';

export default function RiskZonesScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<'list' | 'map'>('map');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [zones, setZones] = useState<RiskZone[]>([]);

  useEffect(() => {
    loadZones();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Ionicons name="map-outline" size={16} color="#409EFF" style={{ marginRight: 4 }} />
            <Text style={styles.headerBadgeText}>{zones.length} 区域</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, zones.length]);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await listRiskZones();
      setZones(data || []);
    } catch (error) {
      console.error('加载风险区域失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadZones();
    setRefreshing(false);
  };

  // 辅助函数（必须在useMemo之前定义）
  const getRiskGradient = (level?: number): [string, string, ...string[]] => {
    switch (level) {
      case 5: return ['#FFE5E5', '#FFCCCC', '#F56C6C'];
      case 4: return ['#FFF7E6', '#FFE7BA', '#FA8C16'];
      case 3: return ['#FFF9E6', '#FFE7BA', '#E6A23C'];
      case 2: return ['#E3F2FD', '#BBDEFB', '#409EFF'];
      case 1: return ['#F1F8F4', '#C5E1A5', '#67C23A'];
      default: return ['#F5F5F5', '#EEEEEE', '#BDBDBD'];
    }
  };

  const getRiskColor = (level?: number) => {
    const map: Record<number, string> = { 5: '#F56C6C', 4: '#FA8C16', 3: '#E6A23C', 2: '#409EFF', 1: '#67C23A' };
    return level ? map[level] || '#909399' : '#909399';
  };

  const getRiskText = (level?: number) => {
    const map: Record<number, string> = { 5: '极高风险', 4: '高风险', 3: '中风险', 2: '低风险', 1: '很低' };
    return level ? map[level] || '未评估' : '未评估';
  };

  // 构建地图GeoJSON（使用颜色区分风险等级）
  const geojson = useMemo(() => {
    const features = zones.map((z) => {
      const g: any = (z as any).geometry;
      if (g?.type && g?.coordinates) {
        const level = z.base_risk_level || 1;
        const color = getRiskColor(level);
        
        return {
          type: 'Feature',
          properties: { 
            id: z.id, 
            name: z.name, 
            code: (z as any).code, 
            riskLevel: level,
            riskText: getRiskText(level),
            fill: color,
            'fill-opacity': 0.35,
            stroke: color,
            'stroke-width': 3,
            'stroke-opacity': 0.9
          },
          geometry: g
        } as import('geojson').Feature;
      }
      return null;
    }).filter(Boolean) as import('geojson').Feature[];
    return { type: 'FeatureCollection', features } as import('geojson').FeatureCollection;
  }, [zones]);

  return (
    <View style={styles.container}>
      <SegmentTabs
        tabs={[{ key: 'map', label: '地图视图' }, { key: 'list', label: '列表视图' }]}
        value={mode}
        onChange={(k) => setMode(k as 'list' | 'map')}
      />

      {mode === 'map' ? (
        loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#409EFF" />
            <Text style={styles.loadingText}>加载地图中...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MapContainer geojson={geojson} />
            <View style={styles.mapLegend}>
              <Text style={styles.legendTitle}>风险等级</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F56C6C' }]} />
                  <Text style={styles.legendText}>极高</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FA8C16' }]} />
                  <Text style={styles.legendText}>高</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#E6A23C' }]} />
                  <Text style={styles.legendText}>中</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#409EFF' }]} />
                  <Text style={styles.legendText}>低</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#67C23A' }]} />
                  <Text style={styles.legendText}>很低</Text>
                </View>
              </View>
            </View>
          </View>
        )
      ) : (
        <View style={{ flex: 1 }}>
          {loading && zones.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#409EFF" />
            </View>
          ) : zones.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={64} color="#DCDFE6" />
              <Text style={styles.emptyText}>暂无风险区域数据</Text>
            </View>
          ) : (
            <FlatList
              data={zones}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.zoneCard}>
                  <LinearGradient
                    colors={getRiskGradient(item.base_risk_level ?? undefined)}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.riskBadge}>
                        <Ionicons 
                          name="shield" 
                          size={16} 
                          color={getRiskColor(item.base_risk_level ?? undefined)}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.riskText}>{getRiskText(item.base_risk_level ?? undefined)}</Text>
                      </View>
                      <View style={[styles.monitorBadge, { backgroundColor: item.is_monitored ? '#67C23A' : '#909399' }]}>
                        <Text style={styles.monitorText}>{item.is_monitored ? '已监测' : '未监测'}</Text>
                      </View>
                    </View>

                    <Text style={styles.zoneName}>{item.name}</Text>
                    <Text style={styles.zoneCode}>代码: {item.code || '未设置'}</Text>

                    <View style={styles.infoGrid}>
                      {item.population_density && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>人口密度</Text>
                          <Text style={styles.infoValue}>{item.population_density.toFixed(0)} 人/km²</Text>
                        </View>
                      )}
                      {item.elevation_avg && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>平均海拔</Text>
                          <Text style={styles.infoValue}>{item.elevation_avg.toFixed(0)} 米</Text>
                        </View>
                      )}
                      {item.slope_avg && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>平均坡度</Text>
                          <Text style={styles.infoValue}>{item.slope_avg.toFixed(1)}°</Text>
                        </View>
                      )}
                      {item.vegetation_coverage && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>植被覆盖</Text>
                          <Text style={styles.infoValue}>{(item.vegetation_coverage * 100).toFixed(0)}%</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerRight: { paddingRight: 12 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  headerBadgeText: { color: '#409EFF', fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#909399' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#909399', marginTop: 16 },
  mapLegend: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  legendTitle: { fontSize: 13, fontWeight: '700', color: '#303133', marginBottom: 8 },
  legendItems: { gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 12, color: '#606266' },
  listContent: { padding: 16 },
  zoneCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  cardGradient: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  riskBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  riskText: { fontSize: 13, fontWeight: '700', color: '#303133' },
  monitorBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  monitorText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  zoneName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  zoneCode: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 12 },
  infoGrid: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { minWidth: '45%' },
  infoLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
