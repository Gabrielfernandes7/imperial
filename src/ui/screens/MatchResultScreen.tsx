import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Crown, Home, RotateCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';

type MatchResultScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MatchResult'>;
  route: RouteProp<RootStackParamList, 'MatchResult'>;
};

export function MatchResultScreen({ navigation, route }: MatchResultScreenProps) {
  const { winnerId, winnerName, humanPlayerId, totalTurns } = route.params;
  const humanWon = winnerId === humanPlayerId;

  return (
    <SafeAreaView className="flex-1 bg-imperial-cream">
      <View className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-imperial-gold/15" />
      <View className="flex-1 justify-center px-6 pb-8">
        <View
          className={`mb-8 h-24 w-24 items-center justify-center rounded-[32px] border ${
            humanWon
              ? 'border-imperial-gold/40 bg-amber-50'
              : 'border-imperial-brown/20 bg-white'
          }`}
        >
          <Crown color={humanWon ? '#A56E12' : '#78716C'} size={48} />
        </View>

        <Text className="text-xs font-bold uppercase tracking-[3px] text-imperial-green">
          Fim da disputa
        </Text>
        <Text className="mt-2 text-5xl font-black text-imperial-brown">
          {humanWon ? 'Vitória' : 'Derrota'}
        </Text>
        <Text className="mt-4 text-lg leading-7 text-stone-600">
          {humanWon
            ? 'Sua influência prevaleceu sobre todas as intrigas da corte.'
            : `${winnerName} reuniu a última influência oculta e venceu a partida.`}
        </Text>

        <View className="my-10 rounded-3xl border border-imperial-gold/25 bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm text-stone-500">Novo Imperador</Text>
            <Text className="font-black text-imperial-green">
              {humanWon ? 'Você' : winnerName}
            </Text>
          </View>
          <View className="h-px bg-stone-100" />
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm text-stone-500">Duração</Text>
            <Text className="font-bold text-imperial-brown">{totalTurns} turnos</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.replace('NewGame')}
          className="mb-3 flex-row items-center justify-center rounded-2xl bg-imperial-green py-5"
        >
          <RotateCcw color="#F5F0E6" size={21} />
          <Text className="ml-2 text-lg font-bold text-imperial-cream">Nova partida</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          className="flex-row items-center justify-center rounded-2xl border border-imperial-brown/20 bg-white py-4"
        >
          <Home color="#5E412F" size={20} />
          <Text className="ml-2 font-bold text-imperial-brown">Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
