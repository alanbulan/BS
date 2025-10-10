import React, { useEffect, useState } from 'react';
import { View, Text, Switch, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPublicConfigs, PublicConfigItem } from '../api/systemConfig';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<PublicConfigItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [testModeValue, darkModeValue, locationValue, notificationValue] = await Promise.all([
        AsyncStorage.getItem('testMode'),
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('locationEnabled'),
        AsyncStorage.getItem('notificationEnabled')
      ]);
      
      if (testModeValue !== null) setTestMode(testModeValue === 'true');
      if (darkModeValue !== null) setDarkMode(darkModeValue === 'true');
      if (locationValue !== null) setLocationEnabled(locationValue === 'true');
      else setLocationEnabled(true); // 默认开启
      if (notificationValue !== null) setNotificationEnabled(notificationValue === 'true');
      else setNotificationEnabled(true); // 默认开启
    } catch (error) {
      console.error('读取设置失败:', error);
    }
  };

  const handleTestModeChange = async (value: boolean) => {
    setTestMode(value);
    try {
      await AsyncStorage.setItem('testMode', value.toString());
      Alert.alert(
        '测试模式',
        value 
          ? '已启用测试模式\n\n位置将强制设置在海淀香山风险区域内（高风险区），用于演示灾害场景和路径规划功能。'
          : '已关闭测试模式，使用真实GPS定位。',
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('保存测试模式失败:', error);
    }
  };

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getPublicConfigs();
      setConfigs(data || []);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDarkModeChange = async (value: boolean) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
      Alert.alert(
        '深色模式',
        value ? '深色模式已启用（需要重启应用生效）' : '深色模式已关闭',
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('保存深色模式失败:', error);
    }
  };

  const handleLocationChange = async (value: boolean) => {
    setLocationEnabled(value);
    try {
      await AsyncStorage.setItem('locationEnabled', value.toString());
      Alert.alert(
        '定位服务',
        value ? '定位服务已启用\n可查找附近避难所和风险区域' : '定位服务已关闭\n部分功能可能不可用',
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('保存定位设置失败:', error);
    }
  };

  const handleNotificationChange = async (value: boolean) => {
    setNotificationEnabled(value);
    try {
      await AsyncStorage.setItem('notificationEnabled', value.toString());
      Alert.alert(
        '推送通知',
        value ? '推送通知已启用\n将接收预警和灾害提醒' : '推送通知已关闭\n不会接收任何通知',
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('保存通知设置失败:', error);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      '关于系统',
      '智能化地质灾害风险评估系统\n\n' +
      '版本: v1.2.0 智能导航版\n' +
      '构建日期: 2025-10-09\n\n' +
      '核心功能:\n' +
      '• A*智能路径规划\n' +
      '• 实时GPS导航\n' +
      '• 风险区域评估\n' +
      '• 机器学习预测\n\n' +
      '© 2025 智能灾害预警平台',
      [{ text: '确定' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      '帮助中心',
      '使用指南:\n\n' +
      '1. 查看预警: 首页实时预警提醒\n' +
      '2. 智能导航: 逃生路线 → 计算路径\n' +
      '3. 避难所: 查找附近安全区域\n' +
      '4. 上报灾害: 我的报告 → 创建\n\n' +
      '联系方式:\n' +
      'Email: support@disaster.com\n' +
      'Tel: 400-123-4567\n' +
      '紧急求助: 110/119',
      [
        { text: '查看文档', onPress: () => Linking.openURL('https://github.com') },
        { text: '确定' }
      ]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      '隐私政策',
      '数据收集说明:\n\n' +
      '• 位置信息: 用于风险评估和路径规划\n' +
      '• 上报数据: 用于灾害信息收集\n' +
      '• 使用统计: 用于改进系统功能\n\n' +
      '数据安全:\n' +
      '• 所有数据加密传输(HTTPS)\n' +
      '• 本地数据安全存储\n' +
      '• 不会泄露给第三方\n\n' +
      '您可以随时在设置中关闭相关权限',
      [{ text: '我知道了' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 应用设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color="#409EFF" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.settingLabel}>深色模式</Text>
                <Text style={styles.settingDesc}>护眼夜间模式</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeChange}
              trackColor={{ false: '#DCDFE6', true: '#409EFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={24} color="#67C23A" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.settingLabel}>定位服务</Text>
                <Text style={styles.settingDesc}>查找附近信息</Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationChange}
              trackColor={{ false: '#DCDFE6', true: '#67C23A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#E6A23C" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.settingLabel}>推送通知</Text>
                <Text style={styles.settingDesc}>接收预警提醒</Text>
              </View>
            </View>
            <Switch
              value={notificationEnabled}
              onValueChange={handleNotificationChange}
              trackColor={{ false: '#DCDFE6', true: '#E6A23C' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 开发者选项 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>开发者选项</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="flask-outline" size={24} color="#F56C6C" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>测试模式</Text>
                <Text style={styles.settingDesc}>
                  模拟位于海淀香山风险区域内，用于演示灾害场景
                </Text>
              </View>
            </View>
            <Switch
              value={testMode}
              onValueChange={handleTestModeChange}
              trackColor={{ false: '#DCDFE6', true: '#F56C6C' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {testMode && (
          <View style={styles.testModeInfo}>
            <Ionicons name="information-circle" size={16} color="#F56C6C" style={{ marginRight: 8 }} />
            <Text style={styles.testModeInfoText}>
              测试位置: 海淀香山 (116.20168, 40.02714)
            </Text>
          </View>
        )}
      </View>

      {/* 其他选项 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
          <Ionicons name="help-circle-outline" size={24} color="#409EFF" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>帮助中心</Text>
          <Ionicons name="chevron-forward" size={20} color="#C0C4CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <Ionicons name="information-circle-outline" size={24} color="#67C23A" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>关于我们</Text>
          <Ionicons name="chevron-forward" size={20} color="#C0C4CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#909399" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>隐私政策</Text>
          <Ionicons name="chevron-forward" size={20} color="#C0C4CC" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            Alert.alert(
              '清除缓存',
              '确定要清除应用缓存吗？\n这将清除图片缓存和临时数据',
              [
                { text: '取消', style: 'cancel' },
                { 
                  text: '确定',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // 清除非必要的缓存数据
                      const keys = await AsyncStorage.getAllKeys();
                      const cacheKeys = keys.filter(k => k.startsWith('cache_'));
                      if (cacheKeys.length > 0) {
                        await AsyncStorage.multiRemove(cacheKeys);
                      }
                      Alert.alert('成功', '缓存已清除');
                    } catch (error) {
                      Alert.alert('失败', '清除缓存失败');
                    }
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#F56C6C" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>清除缓存</Text>
          <Ionicons name="chevron-forward" size={20} color="#C0C4CC" />
        </TouchableOpacity>
      </View>

      {/* 系统配置展示 */}
      {configs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系统配置</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.configCard}>
              {configs.slice(0, 5).map((c) => (
                <View key={c.config_key} style={styles.configRow}>
                  <Text style={styles.configKey} numberOfLines={1}>{c.config_key}</Text>
                  <Text style={styles.configValue} numberOfLines={1}>
                    {typeof c.config_value === 'object' 
                      ? JSON.stringify(c.config_value).slice(0, 30) + '...'
                      : String(c.config_value).slice(0, 30)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>灾害风险评估系统 Mobile</Text>
        <Text style={styles.footerVersion}>Version 1.2.0 智能导航版</Text>
        <Text style={styles.footerBuild}>Build 2025-10-09</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#303133', marginBottom: 12 },
  settingCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#303133', marginBottom: 2 },
  settingDesc: { fontSize: 12, color: '#909399' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
  testModeInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF0F0', padding: 12, borderRadius: 8, marginTop: 12, borderLeftWidth: 4, borderLeftColor: '#F56C6C' },
  testModeInfoText: { flex: 1, fontSize: 13, color: '#F56C6C', fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#303133' },
  configCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  configRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  configKey: { fontSize: 13, fontWeight: '600', color: '#606266', marginBottom: 4 },
  configValue: { fontSize: 12, color: '#909399' },
  footer: { alignItems: 'center', paddingVertical: 40 },
  footerText: { fontSize: 13, color: '#909399', marginBottom: 4 },
  footerVersion: { fontSize: 11, color: '#C0C4CC', marginBottom: 2 },
  footerBuild: { fontSize: 10, color: '#E4E7ED' },
});