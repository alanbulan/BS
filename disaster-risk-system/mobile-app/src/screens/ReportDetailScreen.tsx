import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert, RefreshControl, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getUserReport, deleteUserReport, voteReport } from '../api/userReports';
import type { UserReport } from '../api/userReports';
import { useAuthStore } from '../store/auth';

export default function ReportDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: number };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState<UserReport | null>(null);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getUserReport(id);
      console.log('报告详情数据:', {
        id: data.id,
        status: data.status,
        report_type: data.report_type,
        severity: data.severity,
        images: data.images,
      });
      setReport(data);
    } catch (error) {
      console.error('加载报告详情失败:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '删除后无法恢复，确定要删除这条报告吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserReport(id);
              Alert.alert('成功', '报告已删除');
              navigation.goBack();
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      const updated = await voteReport(id, voteType);
      setReport(updated);
    } catch (error) {
      Alert.alert('错误', '投票失败');
    }
  };

  const getTypeColor = (type?: string) => {
    const map: Record<string, string> = {
      disaster: '#F56C6C',
      infrastructure: '#FA8C16',
      environmental: '#67C23A',
      other: '#909399',
    };
    return type ? map[type] || '#909399' : '#909399';
  };

  const getTypeText = (type?: string) => {
    const map: Record<string, string> = {
      disaster: '灾害报告',
      infrastructure: '基础设施',
      environmental: '环境问题',
      other: '其他',
      emergency: '紧急报告',
      hazard: '隐患报告',
      incident: '事件报告',
    };
    return type ? (map[type] || type) : '未分类';
  };

  const getStatusColor = (status?: string) => {
    const map: Record<string, string> = {
      pending: '#E6A23C',
      verified: '#67C23A',
      rejected: '#F56C6C',
      processing: '#409EFF',
    };
    return status ? map[status] || '#909399' : '#909399';
  };

  const getStatusText = (status?: string) => {
    const map: Record<string, string> = {
      pending: '待审核',
      verified: '已验证',
      rejected: '已拒绝',
      processing: '处理中',
      approved: '已通过',
      under_review: '审核中',
    };
    return status ? (map[status] || status) : '待审核';
  };

  const getSeverityColor = (severity?: string | number) => {
    // 处理数字类型的严重程度 (1-5)
    if (typeof severity === 'number') {
      const numMap: Record<number, string> = {
        1: '#67C23A',
        2: '#85CE61',
        3: '#E6A23C',
        4: '#F56C6C',
        5: '#C71F37',
      };
      return numMap[severity] || '#909399';
    }
    
    // 处理字符串类型
    const map: Record<string, string> = {
      low: '#67C23A',
      medium: '#E6A23C',
      high: '#F56C6C',
      critical: '#C71F37',
    };
    return severity ? map[severity] || '#909399' : '#909399';
  };

  const getSeverityText = (severity?: string | number) => {
    // 处理数字类型的严重程度 (1-5)
    if (typeof severity === 'number') {
      const numMap: Record<number, string> = {
        1: '轻微',
        2: '较轻',
        3: '中等',
        4: '严重',
        5: '危急',
      };
      return numMap[severity] || `等级${severity}`;
    }
    
    // 处理字符串类型
    const map: Record<string, string> = {
      low: '轻微',
      medium: '中等',
      high: '严重',
      critical: '危急',
    };
    return severity ? map[severity] || severity : '未知';
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#409EFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F56C6C" />
        <Text style={styles.errorText}>报告不存在或已被删除</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMyReport = user && user.id === report.user_id;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 报告头部 */}
      <LinearGradient
        colors={[getTypeColor(report.report_type) + '20', '#FFFFFF']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(report.report_type) }]}>
            <Text style={styles.typeBadgeText}>{getTypeText(report.report_type)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor((report as any).verification_status || report.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText((report as any).verification_status || report.status)}</Text>
          </View>
        </View>

        <Text style={styles.title}>{report.title}</Text>
        
        {report.severity && (
          <View style={styles.severityRow}>
            <Ionicons name="alert-circle-outline" size={16} color={getSeverityColor(report.severity)} style={{ marginRight: 6 }} />
            <Text style={[styles.severityText, { color: getSeverityColor(report.severity) }]}>
              严重程度: {getSeverityText(report.severity)}
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#909399" style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>
              {report.created_at ? new Date(report.created_at).toLocaleString('zh-CN') : ''}
            </Text>
          </View>
          {report.view_count !== undefined && (
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#909399" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{report.view_count} 次查看</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* 报告内容 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>详细描述</Text>
        <View style={styles.contentCard}>
          <Text style={styles.description}>{report.description || '无详细描述'}</Text>
        </View>
      </View>

      {/* 位置信息 */}
      {report.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>位置信息</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={24} color="#409EFF" style={{ marginRight: 12 }} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{report.address}</Text>
              {report.longitude && report.latitude && (
                <Text style={styles.coordText}>
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 图片展示 */}
      {report.images && Array.isArray(report.images) && report.images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>相关图片 ({report.images.length})</Text>
          <View style={styles.imageGrid}>
            {report.images.filter((img: any) => {
              const url = typeof img === 'string' ? img : img?.url;
              // 过滤掉示例数据和无效URL
              return url && !url.includes('example.com') && url.trim() !== '';
            }).map((img: any, index: number) => {
              let imageUrl = typeof img === 'string' ? img : img.url;
              // 如果是相对路径，拼接完整URL
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `http://localhost:3000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
              }
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.imageWrapper}
                  onPress={() => Linking.openURL(imageUrl).catch(() => Alert.alert('提示', '无法打开图片'))}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.reportImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {report.images.every((img: any) => {
            const url = typeof img === 'string' ? img : img?.url;
            return !url || url.includes('example.com');
          }) && (
            <View style={styles.noImageCard}>
              <Ionicons name="image-outline" size={48} color="#DCDFE6" />
              <Text style={styles.noImageText}>暂无有效图片</Text>
              <Text style={styles.noImageHint}>示例数据或图片已过期</Text>
            </View>
          )}
        </View>
      )}

      {/* 审核信息 */}
      {report.verification_notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>审核意见</Text>
          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#67C23A" style={{ marginRight: 8 }} />
              <Text style={styles.verificationTitle}>审核人员备注</Text>
            </View>
            <Text style={styles.verificationText}>{report.verification_notes}</Text>
            {report.verified_at && (
              <Text style={styles.verificationTime}>
                审核时间: {new Date(report.verified_at).toLocaleString('zh-CN')}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* 互动统计 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>互动统计</Text>
        <View style={styles.voteCard}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => handleVote('upvote')}
          >
            <Ionicons name="thumbs-up-outline" size={24} color="#67C23A" />
            <Text style={styles.voteCount}>{report.upvotes || 0}</Text>
            <Text style={styles.voteLabel}>赞同</Text>
          </TouchableOpacity>

          <View style={styles.voteDivider} />

          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => handleVote('downvote')}
          >
            <Ionicons name="thumbs-down-outline" size={24} color="#F56C6C" />
            <Text style={styles.voteCount}>{report.downvotes || 0}</Text>
            <Text style={styles.voteLabel}>反对</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 操作按钮 */}
      {isMyReport && report.status === 'pending' && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#F56C6C" style={{ marginRight: 6 }} />
            <Text style={styles.deleteButtonText}>删除报告</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#909399' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#909399', marginTop: 16, marginBottom: 24, textAlign: 'center' },
  backButton: { backgroundColor: '#409EFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  
  header: { padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#303133', marginBottom: 12, lineHeight: 30 },
  severityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  severityText: { fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: '#909399' },
  
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#303133', marginBottom: 12 },
  contentCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  description: { fontSize: 15, color: '#606266', lineHeight: 24 },
  
  locationCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#409EFF' },
  locationInfo: { flex: 1 },
  locationText: { fontSize: 15, color: '#303133', fontWeight: '600', marginBottom: 6 },
  coordText: { fontSize: 12, color: '#909399' },
  
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageWrapper: { width: '48%', height: 180, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  reportImage: { width: '100%', height: '100%', backgroundColor: '#F5F7FA' },
  imageOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  noImageCard: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E4E7ED', borderStyle: 'dashed' },
  noImageText: { fontSize: 15, color: '#909399', marginTop: 12, fontWeight: '600' },
  noImageHint: { fontSize: 13, color: '#C0C4CC', marginTop: 4 },
  
  verificationCard: { backgroundColor: '#F0FAF0', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#67C23A' },
  verificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  verificationTitle: { fontSize: 15, fontWeight: '700', color: '#67C23A' },
  verificationText: { fontSize: 14, color: '#606266', lineHeight: 22, marginBottom: 8 },
  verificationTime: { fontSize: 12, color: '#909399' },
  
  voteCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  voteButton: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  voteCount: { fontSize: 20, fontWeight: '900', color: '#303133', marginTop: 8, marginBottom: 4 },
  voteLabel: { fontSize: 12, color: '#909399', fontWeight: '600' },
  voteDivider: { width: 1, backgroundColor: '#F0F0F0' },
  
  actionSection: { paddingHorizontal: 16, marginTop: 24 },
  deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F56C6C', paddingVertical: 14, borderRadius: 8 },
  deleteButtonText: { fontSize: 15, fontWeight: '600', color: '#F56C6C' },
});
