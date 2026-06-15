import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Crown, Home, RotateCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type MatchResultScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MatchResult'>;
  route: RouteProp<RootStackParamList, 'MatchResult'>;
};

export function MatchResultScreen({ navigation, route }: MatchResultScreenProps) {
  const { winnerId, winnerName, humanPlayerId, totalTurns } = route.params;
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const humanWon = winnerId === humanPlayerId;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-night-deep' : 'bg-imperial-cream'}`}>
      {isDark ? <NightSky /> : <View className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-imperial-gold/15" />}
      <View className="flex-1 justify-center px-6 pb-8">
        <View
          className={`mb-8 h-24 w-24 items-center justify-center rounded-[32px] border ${
            humanWon
              ? isDark ? 'border-imperial-gold bg-imperial-gold/10' : 'border-imperial-gold/40 bg-amber-50'
              : isDark ? 'border-white/10 bg-white/5' : 'border-imperial-brown/20 bg-white'
          }`}
        >
          <Crown color={humanWon ? '#A56E12' : isDark ? '#D6D3D1' : '#78716C'} size={48} />
        </View>

        <Text className={`text-xs font-bold uppercase tracking-[3px] ${isDark ? 'text-imperial-gold' : 'text-imperial-green'}`}>
          Fim da disputa
        </Text>
        <Text className={`mt-2 text-5xl font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>
          {humanWon ? 'Vitória' : 'Derrota'}
        </Text>
        <Text className={`mt-4 text-lg leading-7 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
          {humanWon
            ? 'Sua influência prevaleceu sobre todas as intrigas da corte.'
            : `${winnerName} reuniu a última influência oculta e venceu a partida.`}
        </Text>

        <View className={`my-10 rounded-3xl border p-5 ${
          isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/25 bg-white'
        }`}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Novo Imperador</Text>
            <Text className="font-black text-imperial-green">
              {humanWon ? 'Você' : winnerName}
            </Text>
          </View>
          <View className={`h-px ${isDark ? 'bg-white/10' : 'bg-stone-100'}`} />
          <View className="mt-4 flex-row items-center justify-between">
            <Text className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Duração</Text>
            <Text className={`font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{totalTurns} turnos</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.replace('NewGame')}
          className={`mb-3 flex-row items-center justify-center rounded-2xl py-5 ${isDark ? 'bg-imperial-gold' : 'bg-imperial-green'}`}
        >
          <RotateCcw color={isDark ? '#0B1026' : '#F5F0E6'} size={21} />
          <Text className={`ml-2 text-lg font-bold ${isDark ? 'text-night-deep' : 'text-imperial-cream'}`}>Nova partida</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          className={`flex-row items-center justify-center rounded-2xl border py-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-imperial-brown/20 bg-white'
          }`}
        >
          <Home color={isDark ? '#FFFFFF' : '#5E412F'} size={20} />
          <Text className={`ml-2 font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
