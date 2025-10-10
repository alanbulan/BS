import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SegmentTabs from '../components/SegmentTabs';
import MapContainer from '../components/MapContainer';
import { getActiveWarnings, Warning } from '../api/warnings';

export default function WarningsScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<'list' | 'map'>('map'); // 默认显示地图
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Warning[]>([]);

  useEffect(() => {
    loadWarnings();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Ionicons name="alert-circle-outline" size={16} color="#F56C6C" style={{ marginRight: 4 }} />
            <Text style={styles.headerBadgeText}>{items.length} 预警</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, items.length]);

  const loadWarnings = async () => {
    setLoading(true);
    try {
      const data = await getActiveWarnings();
      setItems(data || []);
    } catch (error) {
      console.error('加载预警失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWarnings();
    setRefreshing(false);
  };

  const getWarningGradient = (level?: number): [string, string, ...string[]] => {
    switch (level) {
      case 5: return ['#FFE5E5', '#FFCCCC', '#F56C6C'];
      case 4: return ['#FFF7E6', '#FFE7BA', '#FA8C16'];
      case 3: return ['#FFF9E6', '#FFE7BA', '#E6A23C'];
      case 2: return ['#E3F2FD', '#BBDEFB', '#409EFF'];
      case 1: return ['#F1F8F4', '#C5E1A5', '#67C23A'];
      default: return ['#F5F5F5', '#EEEEEE', '#BDBDBD'];
    }
  };

  const getLevelText = (level?: number) => {
    const map: Record<number, string> = { 5: '特别严重', 4: '严重', 3: '较重', 2: '一般', 1: '注意' };
    return level ? map[level] || '未知' : '未知';
  };

  const getLevelColor = (level?: number) => {
    const map: Record<number, string> = { 5: '#F56C6C', 4: '#FA8C16', 3: '#E6A23C', 2: '#409EFF', 1: '#67C23A' };
    return level ? map[level] || '#909399' : '#909399';
  };

  const getLevelIcon = (level?: number): string => {
    if (!level) return 'information-circle';
    if (level >= 4) return 'warning';
    if (level >= 3) return 'alert-circle';
    if (level >= 2) return 'information-circle';
    return 'checkmark-circle';
  };

  // 构建预警地图GeoJSON
  const geojson = React.useMemo(() => {
    const features: any[] = [];
    
    items.forEach((warning) => {
      const level = warning.warning_level || 1;
      const color = getLevelColor(level);
      
      // 添加预警区域（如果有affected_area几何数据）
      if (warning.affected_area) {
        const geometry = warning.affected_area;
        
        // 验证geometry格式
        if (geometry && geometry.type && geometry.coordinates) {
          features.push({
            type: 'Feature',
            properties: {
              id: `warning-area-${warning.id}`,
              title: warning.title,
              level: level,
              levelText: getLevelText(level),
              fill: color,
              'fill-opacity': 0.3,
              stroke: color,
              'stroke-width': 3,
              'stroke-opacity': 0.8
            },
            geometry: geometry
          });
          
          // 添加预警中心点标记
          const centerCoords = geometry.type === 'Polygon' 
            ? geometry.coordinates[0][0] // 使用第一个坐标点
            : geometry.coordinates;
            
          features.push({
            type: 'Feature',
            properties: {
              id: `warning-marker-${warning.id}`,
              title: warning.title,
              level: level,
              icon: getLevelIcon(level),
              color: color,
              evacuation: warning.evacuation_required
            },
            geometry: {
              type: 'Point',
              coordinates: centerCoords
            }
          });
        }
      }
    });
    
    return { type: 'FeatureCollection', features };
  }, [items]);

  return (
    <View style={styles.container}>
      <SegmentTabs
        tabs={[{ key: 'map', label: '地图视图' }, { key: 'list', label: '列表视图' }]}
        value={mode}
        onChange={(k) => setMode(k as 'list' | 'map')}
      />
      
      {mode === 'map' ? (
        loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#409EFF" /></View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#67C23A" />
            <Text style={styles.emptyText}>当前无活跃预警</Text>
            <Text style={styles.emptyHint}>系统安全运行中</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MapContainer geojson={geojson as any} />
            
            {/* 地图上的统计卡片 */}
            <View style={styles.mapOverlay}>
              <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']} style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Ionicons name="alert-circle" size={20} color="#F56C6C" style={{ marginRight: 8 }} />
                  <Text style={styles.statsTitle}>活跃预警</Text>
                  <View style={styles.statsBadge}>
                    <Text style={styles.statsBadgeText}>{items.length}</Text>
                  </View>
                </View>
                
                <View style={styles.statsGrid}>
                  {[5, 4, 3, 2, 1].map(level => {
                    const count = items.filter(w => w.warning_level === level).length;
                    if (count === 0) return null;
                    
                    return (
                      <View key={level} style={styles.statItem}>
                        <View style={[styles.statDot, { backgroundColor: getLevelColor(level) }]} />
                        <Text style={styles.statLabel}>{getLevelText(level)}</Text>
                        <Text style={styles.statValue}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </LinearGradient>
            </View>
          </View>
        )
      ) : (
        <View style={{ flex: 1 }}>
          {loading && items.length === 0 ? (
            <View style={styles.loading}><ActivityIndicator size="large" color="#409EFF" /></View>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#67C23A" />
              <Text style={styles.emptyText}>当前无活跃预警</Text>
              <Text style={styles.emptyHint}>这是个好消息！</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => (navigation as any).navigate('WarningDetail', { id: item.id })}
                >
                  <LinearGradient
                    colors={getWarningGradient(item.warning_level ?? undefined)}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.levelBadge}>
                        <Ionicons 
                          name="alert-circle" 
                          size={16} 
                          color={getLevelColor(item.warning_level ?? undefined)}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.levelText}>{getLevelText(item.warning_level ?? undefined)}</Text>
                      </View>
                      <Text style={styles.date}>
                        {new Date(item.issue_time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
                    {item.evacuation_required && (
                      <View style={styles.evacuationTag}>
                        <Ionicons name="exit-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.evacuationText}>需要疏散</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
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
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF0F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  headerBadgeText: { color: '#F56C6C', fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#909399', marginTop: 16, marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#67C23A', fontWeight: '600' },
  
  mapOverlay: { position: 'absolute', top: 16, left: 16, right: 16 },
  statsCard: { borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statsTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#303133' },
  statsBadge: { backgroundColor: '#F56C6C', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statsBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  statsGrid: { gap: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  statDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#606266' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#303133' },
  
  listContent: { padding: 16 },
  card: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  cardGradient: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  levelText: { fontSize: 13, fontWeight: '700', color: '#303133' },
  date: { fontSize: 12, color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, lineHeight: 24, textShadowColor: 'rgba(0, 0, 0, 0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  content: { fontSize: 14, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 20 },
  evacuationTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start' },
  evacuationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});