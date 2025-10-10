import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../styles/theme';

interface BadgeProps {
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'base' | 'lg';
  style?: StyleProp<ViewStyle>;
  dot?: boolean;
}

export default function Badge({ 
  label, 
  type = 'primary', 
  size = 'base',
  style,
  dot = false
}: BadgeProps) {
  const typeStyles = {
    primary: { backgroundColor: colors.primary },
    success: { backgroundColor: colors.success },
    warning: { backgroundColor: colors.warning },
    danger: { backgroundColor: colors.danger },
    info: { backgroundColor: colors.info },
  };

  const sizeStyles = {
    sm: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
    base: { paddingHorizontal: spacing.base, paddingVertical: spacing.xs },
    lg: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  };

  const textSizeStyles = {
    sm: { fontSize: typography.sizes.xs },
    base: { fontSize: typography.sizes.sm },
    lg: { fontSize: typography.sizes.base },
  };

  if (dot) {
    return (
      <View style={[styles.dotContainer, style]}>
        <View style={[styles.dot, typeStyles[type]]} />
        <Text style={[styles.dotLabel, textSizeStyles[size]]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, typeStyles[type], sizeStyles[size], style]}>
      <Text style={[styles.badgeText, textSizeStyles[size]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.base,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  dotLabel: {
    color: colors.textRegular,
    fontWeight: typography.weights.medium,
  },
});






