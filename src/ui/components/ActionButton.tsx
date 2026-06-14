import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Shield, Swords } from 'lucide-react-native';

type ActionButtonProps = {
  label: string;
  detail: string;
  cost?: number;
  disabled?: boolean;
  tone?: 'green' | 'gold' | 'danger';
  onPress: () => void;
};

export function ActionButton({
  label,
  detail,
  cost = 0,
  disabled = false,
  tone = 'green',
  onPress,
}: ActionButtonProps) {
  const background = disabled
    ? 'bg-stone-100 border-stone-200'
    : tone === 'gold'
      ? 'bg-amber-50 border-imperial-gold'
      : tone === 'danger'
        ? 'bg-red-50 border-red-500'
        : 'bg-emerald-50 border-imperial-green';
  const textColor = disabled
    ? 'text-stone-400'
    : tone === 'danger'
      ? 'text-red-800'
      : tone === 'gold'
        ? 'text-amber-900'
        : 'text-imperial-green';

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.78}
      className={`mb-1.5 min-h-[72px] w-[48.5%] rounded-xl border p-2.5 ${background}`}
    >
      <View className="mb-1 flex-row items-start justify-between">
        {tone === 'danger' ? (
          <Swords color={disabled ? '#A8A29E' : '#B91C1C'} size={14} />
        ) : (
          <Shield color={disabled ? '#A8A29E' : tone === 'gold' ? '#A56E12' : '#1E5631'} size={14} />
        )}
        {cost > 0 && (
          <Text className={`text-[10px] font-bold ${textColor}`}>{cost} moedas</Text>
        )}
      </View>
      <Text className={`text-xs font-bold ${textColor}`}>{label}</Text>
      <Text className={`mt-0.5 text-[9px] leading-3 ${disabled ? 'text-stone-400' : 'text-stone-600'}`}>
        {detail}
      </Text>
    </TouchableOpacity>
  );
}
