import React from 'react';
import { Text, View } from 'react-native';
import { Coins } from 'lucide-react-native';

type CoinCounterProps = {
  amount: number;
  compact?: boolean;
};

export function CoinCounter({ amount, compact = false }: CoinCounterProps) {
  return (
    <View
      className={`flex-row items-center rounded-full border border-imperial-gold/30 bg-amber-50 ${
        compact ? 'px-2 py-1' : 'px-3 py-2'
      }`}
    >
      <Coins color="#A56E12" size={compact ? 14 : 18} />
      <Text className={`ml-1 font-bold text-amber-900 ${compact ? 'text-sm' : 'text-lg'}`}>
        {amount}
      </Text>
    </View>
  );
}
