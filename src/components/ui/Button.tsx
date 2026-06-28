import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, { container: string; text: string }> = {
  primary:   { container: 'bg-brand-600 rounded-xl py-3 px-5',   text: 'text-white font-semibold text-base' },
  secondary: { container: 'bg-brand-100 rounded-xl py-3 px-5',   text: 'text-brand-700 font-semibold text-base' },
  danger:    { container: 'bg-expense rounded-xl py-3 px-5',      text: 'text-white font-semibold text-base' },
  ghost:     { container: 'bg-transparent py-3 px-5',             text: 'text-brand-600 font-semibold text-base' },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const { container, text } = VARIANTS[variant];
  return (
    <TouchableOpacity
      className={`${container} items-center justify-center ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#0284c7'} />
      ) : (
        <Text className={text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
