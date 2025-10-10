import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listUserReports } from '../api/userReports';
import type { UserReport } from '../api/userReports';
import { useAuthStore } from '../store/auth';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [filter, setFilter] = useState<'my' | 'all'>('my');

  useEffect(() => {
    loadReports();
  }, [filter]);

  // 监听路由参数变化，支持外部触发刷新
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh) {
      console.log('检测到刷新参数，重新加载报告');
      loadReports();
    }
  }, [route.params]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = filter === 'my' && user ? { user_id: user.id, limit: 50 } : { limit: 50 };
      const data = await listUserReports(params);
      setReports(data || []);
    } catch (error) {
      console.error('加载报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getTypeIcon = (type: string): { name: any; color: string } => {
    const map: Record<string, { name: any; color: string }> = { 
      disaster: { name: 'warning', color: '#F56C6C' },
      infrastructure: { name: 'construct', color: '#FA8C16' },
      environmental: { name: 'leaf', color: '#67C23A' },
      other: { name: 'document', color: '#909399' }
    };
    return map[type] || { name: 'document', color: '#909399' };
  };

  const getTypeGradient = (type: string): [string, string, ...string[]] => {
    const map: Record<string, [string, string, ...string[]]> = {
      disaster: ['#FFE5E5', '#FFCCCC', '#F56C6C'],
      infrastructure: ['#FFF7E6', '#FFE7BA', '#FA8C16'],
      environmental: ['#F0FAF0', '#D4EDD4', '#67C23A'],
      other: ['#F5F5F5', '#EEEEEE', '#BDBDBD']
    };
    return map[type] || map.other;
  };

  const getStatusColor = (status?: string) => {
    const map: Record<string, string> = { verified: '#67C23A', rejected: '#F56C6C', processing: '#E6A23C', pending: '#909399' };
    return status ? map[status] || '#909399' : '#909399';
  };

  const getStatusText = (status?: string) => {
    const map: Record<string, string> = { verified: '已验证', rejected: '已拒绝', processing: '处理中', pending: '待处理' };
    return status ? map[status] || '待处理' : '待处理';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'my' && styles.filterBtnActive]}
            onPress={() => setFilter('my')}
          >
            <Text style={[styles.filterText, filter === 'my' && styles.filterTextActive]}>我的报告</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>全部报告</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => (navigation as any).navigate('CreateReport')}
      >
        <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.createGradient}>
          <Ionicons name="add-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.createText}>快速报告灾害</Text>
        </LinearGradient>
      </TouchableOpacity>

      {loading && reports.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#409EFF" />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={64} color="#DCDFE6" />
          <Text style={styles.emptyText}>暂无报告</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => (navigation as any).navigate('CreateReport')}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.emptyButtonText}>立即报告</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => (navigation as any).navigate('ReportDetail', { id: item.id })}
            >
              <LinearGradient
                colors={getTypeGradient(item.report_type)}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeIcon(item.report_type).color + '20' }]}>
                    <Ionicons 
                      name={getTypeIcon(item.report_type).name} 
                      size={20} 
                      color={getTypeIcon(item.report_type).color}
                    />
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor((item as any).verification_status || item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText((item as any).verification_status || item.status)}</Text>
                  </View>
                </View>

                <Text style={styles.reportTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  {item.address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={14} color="rgba(0,0,0,0.6)" style={{ marginRight: 4 }} />
                      <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                    </View>
                  )}
                  <Text style={styles.date}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : ''}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E4E7ED' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F7FA' },
  filterBtnActive: { backgroundColor: '#409EFF' },
  filterText: { fontSize: 15, fontWeight: '600', color: '#606266' },
  filterTextActive: { color: '#FFFFFF' },
  createButton: { margin: 16, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5 },
  createGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  createText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#909399', marginTop: 16, marginBottom: 24 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#409EFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  listContent: { padding: 16 },
  card: { marginBottom: 12, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardGradient: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  reportTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6, lineHeight: 22, textShadowColor: 'rgba(0, 0, 0, 0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  reportDesc: { fontSize: 13, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  address: { flex: 1, fontSize: 12, color: 'rgba(0, 0, 0, 0.6)', marginRight: 8 },
  date: { fontSize: 12, color: 'rgba(0, 0, 0, 0.6)' },
});
