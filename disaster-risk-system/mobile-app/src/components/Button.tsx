import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, spacing, shadows } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  size?: 'sm' | 'base' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  gradient?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  type = 'default',
  size = 'base',
  loading = false,
  disabled = false,
  style,
  textStyle,
  gradient = false,
  icon,
}: ButtonProps) {
  const typeStyles = {
    primary: { backgroundColor: colors.primary },
    success: { backgroundColor: colors.success },
    warning: { backgroundColor: colors.warning },
    danger: { backgroundColor: colors.danger },
    default: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  };

  const textTypeStyles = {
    primary: { color: '#FFFFFF' },
    success: { color: '#FFFFFF' },
    warning: { color: '#FFFFFF' },
    danger: { color: '#FFFFFF' },
    default: { color: colors.textRegular },
  };

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    base: { paddingVertical: spacing.base, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  };

  const textSizeStyles = {
    sm: { fontSize: typography.sizes.sm },
    base: { fontSize: typography.sizes.base },
    lg: { fontSize: typography.sizes.lg },
  };

  const gradientColors = {
    primary: colors.gradients.primary,
    success: colors.gradients.success,
    warning: colors.gradients.warning,
    danger: colors.gradients.danger,
    default: [colors.backgroundLight, colors.backgroundLight],
  };

  const buttonStyle = [
    styles.button,
    typeStyles[type],
    sizeStyles[size],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    textTypeStyles[type],
    textSizeStyles[size],
    textStyle,
  ];

  const ButtonContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={type === 'default' ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {icon}
          <Text style={buttonTextStyle}>{title}</Text>
        </>
      )}
    </>
  );

  if (gradient && type !== 'default') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={style}>
        <LinearGradient
          colors={gradientColors[type] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            sizeStyles[size],
            shadows.base,
            disabled && styles.disabled,
          ]}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...shadows.base,
  },
  buttonText: {
    fontWeight: typography.weights.bold,
    marginLeft: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
