import React from 'react';
import { Text, View } from 'react-native';
import { Coins } from 'lucide-react-native';

import { useThemeStore } from '../../store/themeStore';

type CoinCounterProps = {
  amount: number;
  compact?: boolean;
};

export function CoinCounter({ amount, compact = false }: CoinCounterProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <View
      className={`flex-row items-center rounded-full border ${
        isDark ? 'border-imperial-gold/40 bg-imperial-gold/10' : 'border-imperial-gold/30 bg-amber-50'
      } ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
    >
      <Coins color={isDark ? "#C9A227" : "#A56E12"} size={compact ? 14 : 18} />
      <Text className={`ml-1 font-bold ${isDark ? 'text-imperial-gold' : 'text-amber-900'} ${compact ? 'text-sm' : 'text-lg'}`}>
        {amount}
      </Text>
    </View>
  );
}
