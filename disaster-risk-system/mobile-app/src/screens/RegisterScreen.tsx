import React, { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username || !email || !password) {
      Alert.alert('提示', '请填写必填信息（用户名、邮箱、密码）');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return;
    }
    
    setLoading(true);
    try {
      const resp = await api.post('/auth/register', { 
        username, 
        email, 
        password, 
        phone: phone || undefined,
        full_name: fullName || undefined
      });
      if (resp.data?.success) {
        Alert.alert('注册成功', '请使用新账号登录', [
          { text: '确定', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('注册失败', resp.data?.message || '请检查信息');
      }
    } catch (e: any) {
      Alert.alert('注册失败', e?.response?.data?.error || e?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#67C23A', '#85CE61', '#95D475']}
        style={styles.headerGradient}
      >
        <Ionicons name="person-add" size={48} color="#FFFFFF" style={{ marginBottom: 12 }} />
        <Text style={styles.appTitle}>创建新账号</Text>
        <Text style={styles.appSubtitle}>加入我们，共建安全社区</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="person-outline" size={16} color="#606266" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>用户名 *</Text>
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
                <Ionicons name="mail-outline" size={16} color="#606266" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>邮箱 *</Text>
              </View>
              <TextInput
                placeholder="请输入邮箱地址"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#C0C4CC"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="call-outline" size={16} color="#606266" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>手机号</Text>
              </View>
              <TextInput
                placeholder="请输入手机号（可选）"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholderTextColor="#C0C4CC"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="person" size={16} color="#606266" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>姓名</Text>
              </View>
              <TextInput
                placeholder="请输入真实姓名（可选）"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholderTextColor="#C0C4CC"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="lock-closed-outline" size={16} color="#606266" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>密码 *</Text>
              </View>
              <TextInput
                placeholder="至少6位字符"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#C0C4CC"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="lock-closed" size={16} color="#606266" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>确认密码 *</Text>
              </View>
              <TextInput
                placeholder="再次输入密码"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                placeholderTextColor="#C0C4CC"
              />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#67C23A', '#85CE61', '#95D475']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerText}>立即注册</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                已有账号？<Text style={styles.loginHighlight}>立即登录</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerGradient: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  appSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' },
  scrollView: { flex: 1 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, margin: 20, marginTop: -20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  inputGroup: { marginBottom: 18 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#606266' },
  input: { borderWidth: 1, borderColor: '#DCDFE6', borderRadius: 8, padding: 14, fontSize: 15, color: '#303133', backgroundColor: '#F5F7FA' },
  registerButton: { borderRadius: 8, overflow: 'hidden', shadowColor: '#67C23A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 10, marginBottom: 16 },
  registerGradient: { paddingVertical: 16, alignItems: 'center' },
  registerText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  loginLink: { alignItems: 'center', paddingVertical: 12 },
  loginLinkText: { fontSize: 14, color: '#606266' },
  loginHighlight: { color: '#409EFF', fontWeight: '700' },
});