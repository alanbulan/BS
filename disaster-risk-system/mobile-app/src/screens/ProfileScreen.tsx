import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/auth';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<'username' | 'full_name' | 'phone' | 'department' | 'position' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploading, setUploading] = useState(false);

  // 头像上传
  const handleUploadAvatar = async () => {
    try {
      console.log('[AVATAR] 开始选择头像...');
      
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能上传头像');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        console.log('[AVATAR] 用户取消选择');
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log('[AVATAR] 图片已选择:', imageUri);
      
      setUploading(true);

      // 构建FormData（区分Web和移动端）
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        // Web平台：先转换为Blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || type });
        formData.append('file', file);
        console.log('[AVATAR-WEB] FormData已构建，文件:', file.name, file.type, file.size);
      } else {
        // 移动端：使用URI
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
        console.log('[AVATAR-MOBILE] FormData已构建');
      }

      console.log('[AVATAR] 开始上传到服务器...');

      // 上传图片
      const uploadResponse = await fetch('http://localhost:3000/api/v1/uploads/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      console.log('[AVATAR] 上传结果:', uploadResult);

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || '上传失败');
      }

      const avatarUrl = uploadResult.data.url;
      console.log('[AVATAR] 图片URL:', avatarUrl);

      // 更新用户头像
      const updateResponse = await fetch(`http://localhost:3000/api/v1/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          avatar_url: avatarUrl,
        }),
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        console.log('[AVATAR] 头像更新成功');
        
        // 更新本地用户信息
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          const updatedUser = { ...authStore.user, avatar_url: avatarUrl };
          authStore.user = updatedUser;
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        Alert.alert('成功', '头像已更新');
        window.location.reload();
      } else {
        throw new Error(updateResult.message || '更新失败');
      }
    } catch (error: any) {
      console.error('[AVATAR] 头像上传失败:', error);
      Alert.alert('失败', error.message || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = (field: 'username' | 'full_name' | 'phone' | 'department' | 'position', currentValue?: string) => {
    setEditField(field);
    setEditValue(currentValue || '');
    setEditModalVisible(true);
  };

  const getFieldLabel = (field: string | null): string => {
    const labels: Record<string, string> = {
      username: '用户名',
      full_name: '姓名',
      phone: '手机号',
      department: '部门',
      position: '职位'
    };
    return field ? labels[field] || '信息' : '信息';
  };

  const saveProfileEdit = async () => {
    if (!editField || !editValue.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }

    try {
      // 调用更新API
      const response = await fetch(`http://localhost:3000/api/v1/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        },
        body: JSON.stringify({
          [editField]: editValue
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setEditModalVisible(false);
        
        // 更新本地用户信息（不需要重新登录）
        const updatedUserData = result.data;
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          const newUser = { ...authStore.user, ...updatedUserData };
          authStore.user = newUser;
          // 同步到AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify(newUser));
        }
        
        Alert.alert('成功', '个人信息已更新');
        
        // 刷新页面显示
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        Alert.alert('失败', result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      Alert.alert('错误', '网络请求失败');
    }
  };

  const handleLogout = async () => {
    console.log('[LOGOUT] handleLogout被调用，平台:', Platform.OS);
    
    const performLogout = async () => {
      console.log('[LOGOUT] 开始退出登录...');
      try {
        await logout();
        console.log('[LOGOUT] 退出成功，isAuthenticated应该变为false');
        console.log('[LOGOUT] 当前认证状态:', useAuthStore.getState().isAuthenticated);
      } catch (error) {
        console.error('[LOGOUT] 退出失败:', error);
        if (Platform.OS === 'web') {
          window.alert('退出登录失败');
        } else {
          Alert.alert('错误', '退出登录失败');
        }
      }
    };
    
    // 根据平台使用不同的确认方式
    if (Platform.OS === 'web') {
      // Web平台使用window.confirm
      const confirmed = window.confirm('确定要退出当前账号吗？');
      if (confirmed) {
        await performLogout();
      } else {
        console.log('[LOGOUT] 用户取消退出');
      }
    } else {
      // 移动端使用Alert.alert
      Alert.alert(
        '退出登录',
        '确定要退出当前账号吗？',
        [
          { text: '取消', style: 'cancel', onPress: () => console.log('[LOGOUT] 用户取消退出') },
          { text: '确定', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const getRoleText = (role?: string) => {
    const map: Record<string, string> = {
      admin: '系统管理员',
      expert: '专家用户',
      emergency_manager: '应急管理员',
      user: '普通用户',
    };
    return role ? map[role] || role : '未知';
  };

  const getRoleGradient = (role?: string): [string, string, ...string[]] => {
    const map: Record<string, [string, string, ...string[]]> = {
      admin: ['#F56C6C', '#FA8C16', '#FF6B6B'],
      expert: ['#409EFF', '#667EEA', '#5CADFF'],
      emergency_manager: ['#E6A23C', '#EEBB4D', '#FA8C16'],
      user: ['#67C23A', '#85CE61', '#95D475'],
    };
    return role ? map[role] || map.user : map.user;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
      {/* 用户信息卡片 */}
      <LinearGradient
        colors={getRoleGradient(user?.role)}
        style={styles.userCard}
      >
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleUploadAvatar}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {(user as any)?.avatar_url ? (
            <Image 
              source={{ 
                uri: `http://localhost:3000${(user as any).avatar_url}${
                  (user as any).avatar_url.includes('.') ? '' : '.jpg'
                }` // 如果URL没有扩展名，默认加.jpg
              }} 
              style={styles.avatarImage}
              onError={(e) => console.log('[AVATAR] 图片加载失败，URL:', `http://localhost:3000${(user as any).avatar_url}`)}
            />
          ) : (
            <View style={styles.avatar}>
              {user?.username ? (
                <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
              ) : (
                <Ionicons name="person" size={40} color="#FFFFFF" />
              )}
            </View>
          )}
          
          <View style={styles.uploadBadge}>
            {uploading ? (
              <Text style={styles.uploadingText}>...</Text>
            ) : (
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.userName}>{user?.full_name || user?.username || '未登录'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleText(user?.role)}</Text>
        </View>
      </LinearGradient>

      {/* 用户详细信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账户信息</Text>
        
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('username', user?.username)}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="person-outline" size={18} color="#909399" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>用户名</Text>
            </View>
            <Text style={styles.infoValueFlex}>{user?.username || '未设置'}</Text>
            <Ionicons name="create-outline" size={18} color="#409EFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('full_name', user?.full_name)}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="person-circle-outline" size={18} color="#909399" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>姓名</Text>
            </View>
            <Text style={styles.infoValueFlex}>{user?.full_name || '未设置'}</Text>
            <Ionicons name="create-outline" size={18} color="#409EFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="mail-outline" size={18} color="#909399" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>邮箱</Text>
            </View>
            <Text style={styles.infoValueFlex}>{user?.email || '未设置'}</Text>
          </View>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('phone', user?.phone)}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="call-outline" size={18} color="#909399" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>手机</Text>
            </View>
            <Text style={styles.infoValueFlex}>{user?.phone || '未设置'}</Text>
            <Ionicons name="create-outline" size={18} color="#409EFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('department', user?.department)}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="business-outline" size={18} color="#909399" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>部门</Text>
            </View>
            <Text style={styles.infoValueFlex}>{user?.department || '未设置'}</Text>
            <Ionicons name="create-outline" size={18} color="#409EFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('position', user?.position)}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="briefcase-outline" size={18} color="#909399" style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>职位</Text>
            </View>
            <Text style={styles.infoValueFlex}>{user?.position || '未设置'}</Text>
            <Ionicons name="create-outline" size={18} color="#409EFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 快捷功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷功能</Text>
        
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => (navigation as any).navigate('Reports')}
        >
          <View style={styles.actionLeft}>
            <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.actionIcon}>
              <Ionicons name="document-text-outline" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionText}>我的报告</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0C4CC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => (navigation as any).navigate('Settings')}
        >
          <View style={styles.actionLeft}>
            <LinearGradient colors={['#909399', '#A6A9AD']} style={styles.actionIcon}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionText}>设置</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0C4CC" />
        </TouchableOpacity>
      </View>

      {/* 退出登录 */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            console.log('[BUTTON] 退出按钮被点击');
            handleLogout();
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#F5F5F5', '#EEEEEE']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#606266" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>退出登录</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 版本信息 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>灾害风险评估系统 v1.2.0</Text>
        <Text style={styles.footerText}>© 2025 智能灾害预警平台</Text>
      </View>
      </ScrollView>

      {/* 编辑信息弹窗 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                编辑{getFieldLabel(editField)}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#909399" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`请输入${getFieldLabel(editField)}`}
              placeholderTextColor="#C0C4CC"
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={saveProfileEdit}
              >
                <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.modalButtonGradient}>
                  <Text style={styles.modalButtonText}>保存</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  userCard: { margin: 20, marginTop: 10, borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  avatarContainer: { marginBottom: 16, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFFFFF' },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  uploadBadge: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#409EFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  uploadingText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  roleBadge: { backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  roleText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#303133', marginBottom: 12 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', width: 80 },
  infoLabel: { fontSize: 14, color: '#606266', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#303133' },
  infoValueFlex: { flex: 1, fontSize: 14, color: '#303133', textAlign: 'right', paddingRight: 8 },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionText: { fontSize: 16, fontWeight: '600', color: '#303133' },
  logoutButton: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  logoutGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#606266' },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 12, color: '#C0C4CC', marginBottom: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 400, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#303133' },
  modalInput: { borderWidth: 1, borderColor: '#DCDFE6', borderRadius: 8, padding: 12, fontSize: 15, color: '#303133', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  modalButtonCancel: { borderWidth: 1, borderColor: '#DCDFE6', paddingVertical: 12, alignItems: 'center' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#606266' },
  modalButtonConfirm: {},
  modalButtonGradient: { paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});