import React from 'react';
import { View } from 'react-native';
import { useRTL } from '../../hooks/useRTL';

interface ProgressBarProps {
  percent: number;   // 0-100
  color?: string;
  height?: number;
  overBudget?: boolean;
}

export function ProgressBar({
  percent,
  color = '#0284c7',
  height = 6,
  overBudget = false,
}: ProgressBarProps) {
  const { isRTL } = useRTL();
  const clamped = Math.min(100, Math.max(0, percent));
  const fillColor = overBudget || clamped >= 100 ? '#ef4444' : color;

  return (
    <View
      className="w-full rounded-full overflow-hidden"
      style={{ height, backgroundColor: '#e2e8f0' }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height,
          backgroundColor: fillColor,
          borderRadius: 999,
          // Anchor fill to the start edge regardless of RTL
          alignSelf: isRTL ? 'flex-end' : 'flex-start',
        }}
      />
    </View>
  );
}
