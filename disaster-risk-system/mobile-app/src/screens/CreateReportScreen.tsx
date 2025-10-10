import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { createUserReport, uploadImage } from '../api/userReports';
import { useAuthStore } from '../store/auth';

const REPORT_TYPES = [
  { value: 'disaster', label: '灾害报告', icon: 'warning', color: '#F56C6C' },
  { value: 'infrastructure', label: '基础设施', icon: 'construct', color: '#E6A23C' },
  { value: 'environmental', label: '环境问题', icon: 'leaf', color: '#67C23A' },
  { value: 'other', label: '其他', icon: 'document', color: '#909399' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: '轻微', color: '#67C23A' },
  { value: 'medium', label: '中等', color: '#E6A23C' },
  { value: 'high', label: '严重', color: '#F56C6C' },
  { value: 'critical', label: '特别严重', color: '#C03639' },
];

export default function CreateReportScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 表单数据
  const [reportType, setReportType] = useState('disaster');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // 获取位置
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('位置权限未授予');
        // 使用默认位置
        setLocation({ latitude: 39.9042, longitude: 116.4074 });
        setAddress('位置权限未授予，请手动确认');
        return;
      }

      try {
        console.log('开始获取位置...');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        console.log('位置获取成功:', loc.coords);
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

        // 反向地理编码
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });

          console.log('地址解析结果:', addresses);
          
          if (addresses && addresses[0]) {
            const addr = addresses[0];
            const addressParts = [
              addr.city,
              addr.district,
              addr.street,
              addr.name
            ].filter(Boolean);
            
            const fullAddress = addressParts.join('') || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
            setAddress(fullAddress);
            console.log('解析后的地址:', fullAddress);
          } else {
            setAddress(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
          }
        } catch (addrError) {
          console.error('地址解析失败:', addrError);
          setAddress(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
        }
      } catch (error) {
        console.error('获取位置失败:', error);
        // 使用默认位置
        setLocation({ latitude: 39.9042, longitude: 116.4074 });
        setAddress('定位失败，使用默认位置（北京）');
      }
    })();
  }, []);

  // 选择图片
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限提示', '需要相册权限才能上传图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      // 上传图片
      setUploading(true);
      try {
        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          const formData = new FormData();
          
          // Web端需要特殊处理
          if (Platform.OS === 'web') {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            formData.append('file', file);
          } else {
            formData.append('file', {
              uri: asset.uri,
              name: 'photo.jpg',
              type: 'image/jpeg',
            } as any);
          }

          const url = await uploadImage(formData);
          uploadedUrls.push(url);
        }
        setImages([...images, ...uploadedUrls]);
        Alert.alert('成功', `已上传 ${uploadedUrls.length} 张图片`);
      } catch (error: any) {
        console.error('上传图片失败:', error);
        const errorMsg = error.message || error.response?.data?.error || '图片上传失败，请重试';
        Alert.alert('上传失败', errorMsg);
      } finally {
        setUploading(false);
      }
    }
  };

  // 拍照
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限提示', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
      const formData = new FormData();
      
      // Web端需要特殊处理
      if (Platform.OS === 'web') {
        // 从URI获取Blob
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        // 移动端使用原有格式
        formData.append('file', {
          uri: result.assets[0].uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const url = await uploadImage(formData);
        setImages([...images, url]);
        Alert.alert('成功', '照片已上传');
      } catch (error: any) {
        console.error('上传照片失败:', error);
        const errorMsg = error.message || error.response?.data?.error || '照片上传失败，请重试';
        Alert.alert('上传失败', errorMsg);
      } finally {
        setUploading(false);
      }
    }
  };

  // 提交报告
  const handleSubmit = async () => {
    console.log('开始提交报告，当前状态:', {
      title: title,
      description: description,
      location: location,
      reportType: reportType,
      severity: severity,
      images: images,
    });
    
    // 验证
    if (!title.trim()) {
      Alert.alert('提示', '请输入报告标题');
      return;
    }
    if (!description.trim()) {
      Alert.alert('提示', '请输入详细描述');
      return;
    }
    if (!location) {
      Alert.alert('提示', '正在获取位置信息，请稍后再试');
      return;
    }

    setLoading(true);
    try {
      // 转换severity为数字
      const severityMap: Record<string, number> = {
        low: 1,
        medium: 3,
        high: 4,
        critical: 5,
      };
      const severityNum = severityMap[severity] || 3;
      
      const reportData = {
        report_type: reportType,
        title: title.trim(),
        description: description.trim(),
        longitude: location.longitude,
        latitude: location.latitude,
        address: address,
        severity: severityNum,
        images: images,
      };
      
      console.log('提交数据:', reportData);
      const result = await createUserReport(reportData);
      console.log('提交成功:', result);

      // 清空表单
      setTitle('');
      setDescription('');
      setImages([]);
      setReportType('disaster');
      setSeverity('medium');
      
      Alert.alert('提交成功', '报告已提交，感谢您的贡献！', [
        { 
          text: '返回列表', 
          onPress: () => {
            navigation.goBack();
            // 触发父页面刷新（如果有的话）
            if ((navigation as any).getParent()?.getState) {
              setTimeout(() => {
                (navigation as any).navigate('Reports', { refresh: Date.now() });
              }, 100);
            }
          }
        },
        {
          text: '继续上报',
          style: 'default'
        }
      ]);
    } catch (error: any) {
      console.error('提交报告失败:', error);
      const errorMsg = error.message || '提交失败，请检查网络后重试';
      Alert.alert('提交失败', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 报告类型选择 */}
      <View style={styles.section}>
        <Text style={styles.label}>报告类型 *</Text>
        <View style={styles.typeGrid}>
          {REPORT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                reportType === type.value && { borderColor: type.color, borderWidth: 2 }
              ]}
              onPress={() => setReportType(type.value)}
            >
              <Ionicons name={type.icon as any} size={32} color={reportType === type.value ? type.color : '#C0C4CC'} />
              <Text style={styles.typeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 严重程度 */}
      <View style={styles.section}>
        <Text style={styles.label}>严重程度 *</Text>
        <View style={styles.severityRow}>
          {SEVERITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.severityButton,
                severity === level.value && { backgroundColor: level.color }
              ]}
              onPress={() => setSeverity(level.value as any)}
            >
              <Text style={[
                styles.severityText,
                severity === level.value && { color: '#FFFFFF' }
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 标题 */}
      <View style={styles.section}>
        <Text style={styles.label}>标题 *</Text>
        <TextInput
          style={styles.input}
          placeholder="简要描述灾害情况"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* 详细描述 */}
      <View style={styles.section}>
        <Text style={styles.label}>详细描述 *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="请详细描述您观察到的情况，包括时间、地点、范围、影响等"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* 位置信息 */}
      <View style={styles.section}>
        <Text style={styles.label}>位置信息</Text>
        {location ? (
          <View style={styles.locationCard}>
            <Ionicons name="location" size={24} color="#409EFF" style={{ marginRight: 12 }} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{address || '正在解析地址...'}</Text>
              <Text style={styles.coordinateText}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.locationLoading}>正在获取位置...</Text>
        )}
      </View>

      {/* 图片上传 */}
      <View style={styles.section}>
        <Text style={styles.label}>上传图片（可选）</Text>
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.imageActionButton}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="#409EFF" style={{ marginBottom: 6 }} />
            <Text style={styles.imageActionText}>拍照</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageActionButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="images" size={20} color="#409EFF" style={{ marginBottom: 6 }} />
            <Text style={styles.imageActionText}>从相册选择</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#409EFF" />
            <Text style={styles.uploadingText}>上传中...</Text>
          </View>
        )}

        {images.length > 0 && (
          <View style={styles.imageGrid}>
            {images.map((url, index) => {
              // 确保URL是完整的
              let imageUrl = url;
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `http://localhost:3000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
              }
              
              return (
                <View key={index} style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImages(images.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 提交按钮 */}
      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>提交报告</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
      </View>

      {/* 底部提示 */}
      <View style={styles.hintSection}>
        <View style={styles.hintRow}>
          <Ionicons name="bulb-outline" size={16} color="#909399" style={{ marginRight: 6 }} />
          <Text style={styles.hintText}>
            提示：您的报告将帮助相关部门更快响应灾害，请如实填写。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  section: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303133',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: '48%',
    aspectRatio: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCDFE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  typeLabel: {
    fontSize: 14,
    color: '#606266',
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#DCDFE6',
  },
  severityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#606266',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCDFE6',
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    color: '#303133',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#ECF5FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#409EFF',
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#303133',
    marginBottom: 4,
  },
  coordinateText: {
    fontSize: 12,
    color: '#909399',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  locationLoading: {
    fontSize: 14,
    color: '#909399',
    fontStyle: 'italic',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ECF5FF',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#B3D8FF',
  },
  imageActionText: {
    fontSize: 14,
    color: '#409EFF',
    fontWeight: '600',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#409EFF',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    marginRight: '3.5%',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E4E7ED',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  submitSection: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#409EFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDFE6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#606266',
  },
  hintSection: {
    padding: 16,
    paddingTop: 0,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#909399',
    lineHeight: 19,
  },
});


