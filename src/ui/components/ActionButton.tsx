import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Shield, Swords } from 'lucide-react-native';

import { useThemeStore } from '../../store/themeStore';

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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const getStyles = () => {
    if (disabled) {
      return {
        bg: isDark ? 'bg-night-mid border-white/10' : 'bg-stone-100 border-stone-200',
        text: isDark ? 'text-stone-500' : 'text-stone-400',
        detail: isDark ? 'text-stone-500' : 'text-stone-400',
      };
    }
    if (tone === 'danger') {
      return {
        bg: isDark ? 'bg-red-950 border-red-500/70' : 'bg-red-50 border-red-500',
        text: isDark ? 'text-red-400' : 'text-red-800',
        detail: isDark ? 'text-stone-400' : 'text-stone-600',
      };
    }
    if (tone === 'gold') {
      return {
        bg: isDark ? 'bg-night-accent border-imperial-gold' : 'bg-amber-50 border-imperial-gold',
        text: isDark ? 'text-imperial-gold' : 'text-amber-900',
        detail: isDark ? 'text-stone-400' : 'text-stone-600',
      };
    }
    return {
      bg: isDark ? 'bg-night-accent border-emerald-500/70' : 'bg-emerald-50 border-imperial-green',
      text: isDark ? 'text-emerald-400' : 'text-imperial-green',
      detail: isDark ? 'text-stone-400' : 'text-stone-600',
    };
  };

  const styles = getStyles();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.78}
      className={`mb-1.5 min-h-[72px] w-[48.5%] rounded-xl border p-2.5 ${styles.bg}`}
    >
      <View className="mb-1 flex-row items-start justify-between">
        {tone === 'danger' ? (
          <Swords color={disabled ? (isDark ? '#444' : '#A8A29E') : (isDark ? '#F87171' : '#B91C1C')} size={14} />
        ) : (
          <Shield color={disabled ? (isDark ? '#444' : '#A8A29E') : tone === 'gold' ? '#C9A227' : (isDark ? '#34D399' : '#1E5631')} size={14} />
        )}
        {cost > 0 && (
          <Text className={`text-[10px] font-bold ${styles.text}`}>{cost} moedas</Text>
        )}
      </View>
      <Text className={`text-xs font-bold ${styles.text}`}>{label}</Text>
      <Text className={`mt-0.5 text-[9px] leading-3 ${styles.detail}`}>
        {detail}
      </Text>
    </TouchableOpacity>
  );
}
