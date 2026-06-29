import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useRTL } from '../../hooks/useRTL';

interface AmountInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (val: string) => void;
  label?: string;
  error?: string;
}

export const AmountInput = forwardRef<TextInput, AmountInputProps>(
  ({ value, onChangeText, label, error, onFocus, ...props }, ref) => {
    const symbol = useSettingsStore((s) => s.settings.currencySymbol);
    const { isRTL, textAlign } = useRTL();
    const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();

    const handleChange = (text: string) => {
      // Allow only digits and one decimal point
      const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      onChangeText(cleaned);
    };

    const handleFocus = (e: any) => {
      const len = value.length;
      setSelection({ start: len, end: len });
      setTimeout(() => setSelection(undefined), 50);
      onFocus?.(e);
    };

    return (
      <View className="mb-4">
        {label && (
          <Text className="text-sm font-medium text-slate-600 mb-1" style={{ textAlign }}>
            {label}
          </Text>
        )}
        <View
          className={`flex-row items-center border rounded-xl px-3 py-2 ${error ? 'border-expense' : 'border-slate-200'} bg-slate-50`}
        >
          <Text className="text-slate-500 text-lg mr-1">{symbol}</Text>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={handleChange}
            onFocus={handleFocus}
            selection={selection}
            keyboardType="decimal-pad"
            placeholderTextColor="#94a3b8"
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: '600',
              color: '#0f172a',
              textAlign,
            }}
            {...props}
          />
        </View>
        {error && (
          <Text className="text-expense text-xs mt-1" style={{ textAlign }}>
            {error}
          </Text>
        )}
      </View>
    );
  },
);

AmountInput.displayName = 'AmountInput';
