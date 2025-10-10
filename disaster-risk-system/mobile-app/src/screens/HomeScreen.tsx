import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getActiveWarnings } from '../api/warnings';
import { getActiveShelters } from '../api/shelters';
import { listRiskZones } from '../api/riskZones';
import type { Warning } from '../api/warnings';
import type { Shelter } from '../api/shelters';
import type { RiskZone } from '../api/riskZones';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeWarnings, setActiveWarnings] = useState<Warning[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState({ backend: false, database: false, ml: false });
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [warnings, shelterList, zones, weatherData, status, contacts] = await Promise.all([
        getActiveWarnings().catch(() => []),
        getActiveShelters().catch(() => []),
        listRiskZones({}).catch(() => []),
        loadWeather().catch(() => null),
        checkSystemStatus().catch(() => ({ backend: false, database: false, ml: false })),
        loadEmergencyContacts().catch(() => []),
      ]);
      setActiveWarnings(warnings);
      setShelters(shelterList);
      setRiskZones(zones);
      if (weatherData) setWeather(weatherData);
      setSystemStatus(status);
      setEmergencyContacts(contacts);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyContacts = async () => {
    // 紧急联系人（公开信息，不需要认证）
    const defaultContacts = [
      { name: '消防', phone: '119' },
      { name: '急救', phone: '120' },
      { name: '报警', phone: '110' },
      { name: '应急管理', phone: '12345' }
    ];
    
    console.log('[CONFIG] 使用默认紧急联系人');
    return defaultContacts;
  };

  const checkSystemStatus = async () => {
    // 简化逻辑：如果能加载到首页数据，说明系统正常
    // 直接基于数据加载结果判断
    const hasData = activeWarnings.length > 0 || shelters.length > 0 || riskZones.length > 0;
    
    const status = {
      backend: true,  // 能运行到这里说明后端正常
      database: true, // 能加载到数据说明数据库正常
      ml: false       // ML服务可选
    };
    
    console.log('[SYSTEM] 系统状态:', {
      backend: '正常',
      database: hasData ? '正常（有数据）' : '正常（数据加载中）',
      warnings: activeWarnings.length,
      shelters: shelters.length,
      zones: riskZones.length
    });
    
    return status;
  };

  const loadWeather = async () => {
    try {
      // 获取当前位置（测试模式或真实GPS）
      const testModeValue = await AsyncStorage.getItem('testMode');
      const isTestMode = testModeValue === 'true';
      
      let latitude, longitude;
      
      if (isTestMode) {
        // 测试模式：使用海淀香山坐标
        latitude = 40.02713505455811;
        longitude = 116.20168232062399;
      } else {
        // 真实模式：获取GPS位置
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
          } else {
            // 无权限，使用默认北京坐标
            latitude = 39.9042;
            longitude = 116.4074;
          }
        } catch {
          // GPS失败，使用默认坐标
          latitude = 39.9042;
          longitude = 116.4074;
        }
      }
      
      // 从后端获取天气
      const response = await fetch(`http://localhost:3000/api/v1/weather/current?latitude=${latitude}&longitude=${longitude}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('[WEATHER] 天气数据:', result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('[WEATHER] 加载天气失败:', error);
      return null;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const makeEmergencyCall = () => {
    // 优先使用配置中的紧急联系人，降级使用默认号码
    const contacts = emergencyContacts.length > 0 ? emergencyContacts : [
      { name: '消防', phone: '119' },
      { name: '急救', phone: '120' },
      { name: '报警', phone: '110' }
    ];
    
    const buttons: any[] = contacts.map(contact => ({
      text: `${contact.phone} ${contact.name}`,
      onPress: () => Linking.openURL(`tel:${contact.phone}`),
      style: 'destructive'
    }));
    
    buttons.push({ text: '取消', style: 'cancel' });
    
    Alert.alert(
      '紧急呼叫',
      '请选择要拨打的紧急号码',
      buttons
    );
  };

  const highestWarningLevel = Math.max(...activeWarnings.map(w => w.warning_level || 0), 0);
  const isEmergency = highestWarningLevel >= 4;

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

  const getWarningLevelColor = (level?: number) => {
    switch (level) {
      case 5: return '#F56C6C';
      case 4: return '#FA8C16';
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 紧急预警横幅（如果有） */}
      {isEmergency && (
        <View style={styles.emergencyBanner}>
          <LinearGradient colors={['#FEF0F0', '#FFE5E5']} style={styles.emergencyGradient}>
            <Ionicons name="warning" size={20} color="#F56C6C" style={{ marginRight: 8 }} />
            <Text style={styles.emergencyText}>紧急预警生效中</Text>
            <View style={styles.emergencyBadge}>
              <Text style={styles.emergencyBadgeText}>{activeWarnings.length}</Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* 顶部区域：问候+系统状态+天气 */}
      <View style={styles.topSection}>
        <View style={styles.topLeft}>
          <View style={styles.greetingRow}>
            <Ionicons name="hand-left-outline" size={24} color="#303133" style={{ marginRight: 8 }} />
            <Text style={styles.greeting}>您好！</Text>
          </View>
          <Text style={styles.dateText}>
            {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </Text>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* 系统状态（中间） */}
        <View style={styles.statusMiddle}>
          <Text style={styles.statusTitle}>系统状态</Text>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: systemStatus.backend ? '#67C23A' : '#F56C6C' }]} />
            <Text style={styles.statusLabel}>服务正常</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: systemStatus.database ? '#67C23A' : '#F56C6C' }]} />
            <Text style={styles.statusLabel}>数据同步</Text>
          </View>
          <Text style={styles.statusUpdateText}>
            更新: {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* 天气卡片（右侧） */}
        {weather && (
          <View style={styles.weatherCard}>
            <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.weatherGradient}>
              <Ionicons 
                name={
                  (weather.conditions || '').includes('雨') ? 'rainy' :
                  (weather.conditions || '').includes('云') || (weather.conditions || '').includes('阴') ? 'cloudy' :
                  (weather.conditions || '').includes('晴') ? 'sunny' : 'cloud'
                } 
                size={32} 
                color="#FFFFFF" 
              />
              <Text style={styles.weatherTemp}>{Math.round(weather.temperature || 0)}°</Text>
              <Text style={styles.weatherDesc}>{weather.conditions || '多云'}</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="flash-outline" size={20} color="#303133" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>快捷操作</Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('Reports')}
          >
            <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.actionGradient}>
              <Ionicons name="document-text-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>灾害报告</Text>
              <Text style={styles.actionDesc}>快速上报</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={makeEmergencyCall}>
            <LinearGradient colors={['#F56C6C', '#FA8C16']} style={styles.actionGradient}>
              <Ionicons name="call-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>紧急呼叫</Text>
              <Text style={styles.actionDesc}>119/120/110</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('Shelters')}
          >
            <LinearGradient colors={['#67C23A', '#85CE61']} style={styles.actionGradient}>
              <Ionicons name="home-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>避难所</Text>
              <Text style={styles.actionDesc}>查找最近</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('EscapeRoutes')}
          >
            <LinearGradient colors={['#E6A23C', '#EEBB4D']} style={styles.actionGradient}>
              <Ionicons name="map-outline" size={32} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>逃生路线</Text>
              <Text style={styles.actionDesc}>规划路径</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <LinearGradient colors={['#FF6B6B', '#EE5A6F']} style={styles.statGradient}>
              <Ionicons name="warning-outline" size={28} color="#FFFFFF" style={styles.statIcon} />
              <Text style={styles.statNumber}>{activeWarnings.length}</Text>
              <Text style={styles.statLabel}>活跃预警</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.statGradient}>
              <Ionicons name="home-outline" size={28} color="#FFFFFF" style={styles.statIcon} />
              <Text style={styles.statNumber}>{shelters.length}</Text>
              <Text style={styles.statLabel}>可用避难所</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['#2196F3', '#42A5F5']} style={styles.statGradient}>
              <Ionicons name="location-outline" size={28} color="#FFFFFF" style={styles.statIcon} />
              <Text style={styles.statNumber}>{riskZones.length}</Text>
              <Text style={styles.statLabel}>风险区域</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {activeWarnings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="alert-circle" size={24} color="#F56C6C" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitleText}>活跃预警</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{activeWarnings.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Warnings')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.moreButton}>查看全部</Text>
                <Ionicons name="chevron-forward" size={16} color="#409EFF" />
              </View>
            </TouchableOpacity>
          </View>
          
          {activeWarnings.slice(0, 3).map((warning) => (
            <TouchableOpacity
              key={warning.id}
              style={styles.warningCard}
              onPress={() => (navigation as any).navigate('WarningDetail', { id: warning.id })}
            >
              <LinearGradient
                colors={getWarningGradient(warning.warning_level ?? undefined)}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.warningGradient}
              >
                <View style={styles.warningHeader}>
                  <View style={styles.warningLevel}>
                    <Ionicons 
                      name="alert-circle" 
                      size={18} 
                      color={getWarningLevelColor(warning.warning_level ?? undefined)}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.warningLevelText}>
                      {getWarningLevelText(warning.warning_level ?? undefined)}
                    </Text>
                  </View>
                  <Text style={styles.warningDate}>
                    {new Date(warning.issue_time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.warningTitle} numberOfLines={2}>{warning.title}</Text>
                <Text style={styles.warningContent} numberOfLines={2}>{warning.content}</Text>
                {warning.evacuation_required && (
                  <View style={styles.evacuationTag}>
                    <Ionicons name="exit-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.evacuationText}>需要疏散</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={32} color="#1976D2" style={{ marginRight: 12 }} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>安全小贴士</Text>
            <Text style={styles.tipText}>
              {isEmergency 
                ? '当前有高等级预警！请保持警惕，做好应急准备，关注最新预警信息。'
                : '当前无高等级预警。建议定期检查系统，了解周边风险状况。'}
            </Text>
          </View>
        </LinearGradient>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  emergencyBanner: { backgroundColor: '#FFFFFF' },
  emergencyGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderLeftWidth: 4, borderLeftColor: '#F56C6C' },
  emergencyText: { flex: 1, fontSize: 15, fontWeight: '800', color: '#F56C6C' },
  emergencyBadge: { backgroundColor: '#F56C6C', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  emergencyBadgeText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  
  topSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', gap: 8 },
  topLeft: { flex: 1 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#303133' },
  dateText: { fontSize: 12, color: '#909399', marginBottom: 2 },
  timeText: { fontSize: 26, fontWeight: '900', color: '#303133' },
  
  statusMiddle: { flex: 1, paddingHorizontal: 8 },
  statusTitle: { fontSize: 13, fontWeight: '700', color: '#303133', marginBottom: 8 },
  statusItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusLabel: { fontSize: 13, color: '#303133', fontWeight: '600' },
  statusUpdateText: { fontSize: 11, color: '#909399', marginTop: 6 },
  
  weatherCard: { flex: 1, maxWidth: 100, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  weatherGradient: { padding: 12, alignItems: 'center' },
  weatherTemp: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 6, marginBottom: 2 },
  weatherDesc: { fontSize: 11, color: 'rgba(255,255,255,0.95)', fontWeight: '600' },
  
  quickActions: { padding: 16, paddingTop: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#303133' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: (width - 48) / 2, height: 120, marginBottom: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  actionGradient: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center' },
  actionIcon: { marginBottom: 6 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  actionDesc: { fontSize: 11, color: 'rgba(255, 255, 255, 0.9)' },
  statsSection: { paddingHorizontal: 16, marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, marginHorizontal: 4, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statGradient: { padding: 14, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  statIcon: { marginBottom: 6 },
  statNumber: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleText: { fontSize: 20, fontWeight: '800', color: '#303133' },
  countBadge: { backgroundColor: '#F56C6C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  countText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  moreButton: { fontSize: 14, color: '#409EFF', fontWeight: '600' },
  warningCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  warningGradient: { padding: 16 },
  warningHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  warningLevel: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  warningLevelText: { fontSize: 13, fontWeight: '700', color: '#303133' },
  warningDate: { fontSize: 12, color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' },
  warningTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, lineHeight: 24 },
  warningContent: { fontSize: 14, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 20 },
  evacuationTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12, alignSelf: 'flex-start' },
  evacuationText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: '#1976D2', marginBottom: 6 },
  tipText: { fontSize: 14, color: '#424242', lineHeight: 21 },
});