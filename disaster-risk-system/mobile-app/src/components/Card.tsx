import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'base' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg';
  bordered?: boolean;
}

export default function Card({ 
  children, 
  style, 
  padding = 'md',
  shadow = 'base',
  bordered = true
}: CardProps) {
  const paddingStyle = {
    none: {},
    sm: { padding: spacing.sm },
    base: { padding: spacing.base },
    md: { padding: spacing.md },
    lg: { padding: spacing.lg },
  };

  const shadowStyle = {
    none: {},
    sm: shadows.sm,
    base: shadows.base,
    md: shadows.md,
    lg: shadows.lg,
  };

  return (
    <View
      style={[
        styles.card,
        paddingStyle[padding],
        shadowStyle[shadow],
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});






