import React, { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, View, Switch, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuthStore } from '../store/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const onSubmit = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const resp = await api.post('/auth/login', { username, password, rememberMe });
      const success = resp.data?.success;
      if (success) {
        const { user, accessToken, refreshToken } = resp.data.data || {};
        await login({ user, accessToken, refreshToken });
      } else {
        Alert.alert('登录失败', resp.data?.message || '请检查用户名或密码');
      }
    } catch (e: any) {
      Alert.alert('登录失败', e?.response?.data?.message || e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#409EFF', '#5CADFF', '#73B9FF']}
        style={styles.headerGradient}
      >
        <Ionicons name="shield-checkmark" size={52} color="#FFFFFF" style={{ marginBottom: 12 }} />
        <Text style={styles.appTitle}>灾害风险评估系统</Text>
        <Text style={styles.appSubtitle}>智能防灾 · 安全守护</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>账户登录</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="person-outline" size={16} color="#606266" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>用户名</Text>
            </View>
            <TextInput
              placeholder="请输入用户名"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholderTextColor="#C0C4CC"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#606266" style={{ marginRight: 6 }} />
              <Text style={styles.inputLabel}>密码</Text>
            </View>
            <TextInput
              placeholder="请输入密码"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#C0C4CC"
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionText}>记住我</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#DCDFE6', true: '#409EFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={onSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#409EFF', '#5CADFF', '#66B1FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginText}>登录</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              还没有账号？<Text style={styles.registerHighlight}>立即注册</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>登录即表示您同意</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>《用户协议》和《隐私政策》</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerGradient: { paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  appTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  appSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  formContainer: { flex: 1, paddingHorizontal: 20 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginTop: -30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#303133', marginBottom: 24, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#606266' },
  input: { borderWidth: 1, borderColor: '#DCDFE6', borderRadius: 8, padding: 14, fontSize: 15, color: '#303133', backgroundColor: '#F5F7FA' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  optionText: { fontSize: 14, color: '#606266' },
  loginButton: { borderRadius: 8, overflow: 'hidden', shadowColor: '#409EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 16 },
  loginGradient: { paddingVertical: 16, alignItems: 'center' },
  loginText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  registerLink: { alignItems: 'center', paddingVertical: 12 },
  registerText: { fontSize: 14, color: '#606266' },
  registerHighlight: { color: '#409EFF', fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 12, color: '#909399', marginBottom: 4 },
  footerLink: { fontSize: 12, color: '#409EFF' },
});