import React from 'react';
import { View, Text, Pressable } from 'react-native';

export type SegmentTab = {
  key: string;
  label: string;
};

type Props = {
  tabs: SegmentTab[];
  value: string;
  onChange: (key: string) => void;
};

export default function SegmentTabs({ tabs, value, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', padding: 8, gap: 8 }}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? '#1f6feb' : '#f0f2f5',
            }}
          >
            <Text style={{ color: active ? '#fff' : '#333', fontWeight: active ? '700' : '500' }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}