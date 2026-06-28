import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', style, ...props }: CardProps) {
  return (
    <View
      className={`bg-white rounded-2xl shadow-sm p-4 ${className}`}
      style={[{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
