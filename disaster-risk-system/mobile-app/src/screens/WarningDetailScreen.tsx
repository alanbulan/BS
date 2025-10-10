import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getWarning } from '../api/warnings';
import type { Warning } from '../api/warnings';

export default function WarningDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: number };
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<Warning | null>(null);

  useEffect(() => {
    loadWarningDetail();
  }, [id]);

  const loadWarningDetail = async () => {
    try {
      setLoading(true);
      const data = await getWarning(id);
      setWarning(data);
    } catch (error) {
      console.error('加载预警详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 分享预警
  const shareWarning = async () => {
    if (!warning) return;

    try {
      await Share.share({
        title: warning.title,
        message: `预警通知\n\n${warning.title}\n\n${warning.content}\n\n发布时间：${new Date(warning.issue_time).toLocaleString('zh-CN')}\n发布机构：${warning.issuing_authority || '未知'}`,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const getWarningLevelColor = (level?: number) => {
    switch (level) {
      case 5: return '#F56C6C';
      case 4: return '#E6A23C';
      case 3: return '#E6A23C';
      case 2: return '#409EFF';
      case 1: return '#67C23A';
      default: return '#909399';
    }
  };

  const getWarningLevelText = (level?: number) => {
    switch (level) {
      case 5: return '特别严重';
      case 4: return '严重';
      case 3: return '较重';
      case 2: return '一般';
      case 1: return '注意';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#409EFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!warning) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F56C6C" />
        <Text style={styles.errorText}>预警信息不存在</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 预警标题 */}
      <View style={[styles.headerCard, { borderLeftColor: getWarningLevelColor(warning.warning_level ?? undefined) }]}>
        <View style={styles.levelBadgeContainer}>
          <View style={[styles.levelBadge, { backgroundColor: getWarningLevelColor(warning.warning_level ?? undefined) }]}>
            <Text style={styles.levelText}>{getWarningLevelText(warning.warning_level ?? undefined)}</Text>
          </View>
          {warning.evacuation_required && (
            <View style={styles.evacuationBadge}>
              <Text style={styles.evacuationText}>需要疏散</Text>
            </View>
          )}
        </View>
        <Text style={styles.warningTitle}>{warning.title}</Text>
        <Text style={styles.warningId}>预警编号: {warning.warning_id || warning.id}</Text>
      </View>

      {/* 预警内容 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>预警内容</Text>
        <Text style={styles.contentText}>{warning.content}</Text>
      </View>

      {/* 时间信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>时间信息</Text>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>发布时间：</Text>
          <Text style={styles.timeValue}>
            {new Date(warning.issue_time).toLocaleString('zh-CN')}
          </Text>
        </View>
        {warning.effective_time && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>生效时间：</Text>
            <Text style={styles.timeValue}>
              {new Date(warning.effective_time).toLocaleString('zh-CN')}
            </Text>
          </View>
        )}
        {warning.expiry_time && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>失效时间：</Text>
            <Text style={styles.timeValue}>
              {new Date(warning.expiry_time).toLocaleString('zh-CN')}
            </Text>
          </View>
        )}
      </View>

      {/* 发布机构 */}
      {warning.issuing_authority && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>发布机构</Text>
          <Text style={styles.authorityText}>{warning.issuing_authority}</Text>
        </View>
      )}

      {/* 建议行动 */}
      {warning.recommended_actions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>建议行动</Text>
          <View style={styles.actionsCard}>
            <Text style={styles.actionsText}>
              {typeof warning.recommended_actions === 'string' 
                ? warning.recommended_actions 
                : JSON.stringify(warning.recommended_actions, null, 2)}
            </Text>
          </View>
        </View>
      )}

      {/* 避难所推荐 */}
      {warning.shelter_recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>避难所推荐</Text>
          <TouchableOpacity
            style={styles.shelterRecommendButton}
            onPress={() => (navigation as any).navigate('Shelters')}
          >
            <Ionicons name="home-outline" size={20} color="#409EFF" style={{ marginRight: 8 }} />
            <Text style={styles.shelterRecommendText}>查看推荐避难所</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareWarning}
        >
          <Ionicons name="share-social-outline" size={18} color="#409EFF" style={{ marginRight: 6 }} />
          <Text style={styles.shareButtonText}>分享预警</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shelterButton}
          onPress={() => (navigation as any).navigate('Shelters')}
        >
          <Ionicons name="home-outline" size={18} color="#67C23A" style={{ marginRight: 6 }} />
          <Text style={styles.shelterButtonText}>查找避难所</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#909399',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#909399',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#409EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  levelBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  evacuationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F56C6C',
  },
  evacuationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#303133',
    marginBottom: 8,
    lineHeight: 28,
  },
  warningId: {
    fontSize: 13,
    color: '#909399',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303133',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 15,
    color: '#606266',
    lineHeight: 24,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#909399',
    width: 80,
  },
  timeValue: {
    flex: 1,
    fontSize: 14,
    color: '#303133',
  },
  authorityText: {
    fontSize: 15,
    color: '#409EFF',
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FADCA8',
  },
  actionsText: {
    fontSize: 14,
    color: '#606266',
    lineHeight: 22,
  },
  shelterRecommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECF5FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3D8FF',
  },
  shelterRecommendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#409EFF',
  },
  actionSection: {
    padding: 16,
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCDFE6',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#409EFF',
  },
  shelterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#67C23A',
    paddingVertical: 14,
    borderRadius: 8,
  },
  shelterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
