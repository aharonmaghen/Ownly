import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { ring: 18, ringBorder: 1.25, dot: 3.5, fontSize: 17, gap: 3 },
  md: { ring: 24, ringBorder: 1.5,  dot: 4.5, fontSize: 22, gap: 4 },
  lg: { ring: 32, ringBorder: 2,    dot: 6,   fontSize: 30, gap: 5 },
};

export function LogoWordmark({ color = '#ffffff', size = 'md' }: Props) {
  const s = SIZES[size];

  return (
    <View style={styles.row}>
      {/* Ring "O" */}
      <View
        style={[
          styles.ring,
          {
            width: s.ring,
            height: s.ring,
            borderRadius: s.ring / 2,
            borderWidth: s.ringBorder,
            borderColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            { width: s.dot, height: s.dot, borderRadius: s.dot / 2, backgroundColor: color },
          ]}
        />
      </View>

      {/* "wnly" */}
      <Text
        style={[
          styles.text,
          { color, fontSize: s.fontSize, marginLeft: s.gap },
        ]}
      >
        wnly
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
  text: {
    fontWeight: '300',
    letterSpacing: -0.5,
  },
});
