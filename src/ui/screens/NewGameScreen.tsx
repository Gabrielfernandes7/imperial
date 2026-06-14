import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bot, ChevronLeft, Users } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GameMode } from '../../game/models/GameMode';

type NewGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewGame'>;
};

const HISTORICAL_BOTS = [
  'Visconde de Mauá',
  'Condessa de Barral',
  'Conselheiro Rebouças',
  'Duque de Caxias',
  'Barão de Cotegipe',
];

export function NewGameScreen({ navigation }: NewGameScreenProps) {
  const [playerName, setPlayerName] = useState('Você');
  const [botCount, setBotCount] = useState<1 | 2>(2);
  const [mode, setMode] = useState<GameMode>(GameMode.INICIANTE);
  const { height } = useWindowDimensions();
  const compact = height < 780;
  const ultraCompact = height < 720;

  const startGame = () => {
    const normalizedName = playerName.trim() || 'Você';
    // Shuffle and pick historical counselors for the bots
    const shuffled = [...HISTORICAL_BOTS].sort(() => 0.5 - Math.random());
    const bots = shuffled.slice(0, botCount);
    navigation.replace('Game', { playerNames: [normalizedName, ...bots], mode });
  };

  return (
    <SafeAreaView className="flex-1 bg-imperial-cream" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          <TouchableOpacity
            className="mt-2 h-12 w-12 items-center justify-center rounded-2xl border border-imperial-brown/15 bg-white"
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft color="#5E412F" size={26} />
          </TouchableOpacity>

          <View className={ultraCompact ? 'mt-4' : compact ? 'mt-6' : 'mt-10'}>
            <Text className="text-xs font-bold uppercase tracking-[3px] text-imperial-green">
              Preparar a corte
            </Text>
            <Text className={`mt-2 font-black text-imperial-brown ${ultraCompact ? 'text-[16px]' : compact ? 'text-3xl' : 'text-4xl'}`}>
              Nova partida
            </Text>
            <Text className={`mt-2 text-stone-600 ${ultraCompact ? 'text-xs leading-4' : compact ? 'text-sm leading-5' : 'text-base leading-6'}`}>
              Escolha seu nome e quantos adversários controlados pelo jogo entrarão na disputa.
            </Text>
          </View>

          <View className={ultraCompact ? 'mt-4' : compact ? 'mt-5' : 'mt-8'}>
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">
              Tamanho da corte
            </Text>
            <View className="flex-row">
              {[1, 2].map((count) => {
                const selected = botCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    onPress={() => setBotCount(count as 1 | 2)}
                    className={`mr-3 flex-1 rounded-2xl border ${ultraCompact ? 'p-2.5' : compact ? 'p-3' : 'p-4'} ${
                      selected
                        ? 'border-imperial-green bg-emerald-50'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <View className={`${ultraCompact ? 'mb-1.5' : compact ? 'mb-2' : 'mb-4'} flex-row items-center justify-between`}>
                      {count === 1 ? (
                        <Bot color={selected ? '#1E5631' : '#78716C'} size={ultraCompact ? 18 : compact ? 20 : 24} />
                      ) : (
                        <Users color={selected ? '#1E5631' : '#78716C'} size={ultraCompact ? 18 : compact ? 20 : 24} />
                      )}
                      <View
                        className={`${ultraCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} rounded-full border ${
                          selected ? 'border-imperial-green bg-imperial-green' : 'border-stone-300'
                        }`}
                      />
                    </View>
                    <Text className={`font-bold ${ultraCompact ? 'text-[13px]' : compact ? 'text-sm' : 'text-base'} ${selected ? 'text-imperial-green' : 'text-stone-700'}`}>
                      {count + 1} jogadores
                    </Text>
                    <Text className={`${ultraCompact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs'} text-stone-500`}>{count} bot{count > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className={ultraCompact ? 'mt-4' : compact ? 'mt-5' : 'mt-8'}>
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">
              Modo da corte
            </Text>
            <View className="flex-row">
            {[
              {
                value: GameMode.INICIANTE,
                title: 'Iniciante',
              },
              {
                value: GameMode.NORMAL,
                title: 'Normal',
              },
              {
                value: GameMode.AVANCADO,
                title: 'Difícil',
              },
            ].map((option) => {
              const selected = mode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setMode(option.value)}
                  className={`mr-2 flex-1 rounded-2xl border items-center ${ultraCompact ? 'px-2 py-2.5' : compact ? 'px-3 py-3' : 'px-4 py-4'} ${
                    selected
                      ? 'border-imperial-green bg-emerald-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <Text className={`font-bold text-center ${ultraCompact ? 'text-[12px]' : compact ? 'text-sm' : 'text-base'} ${selected ? 'text-imperial-green' : 'text-imperial-brown'}`}>
                    {option.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
            </View>
          </View>

          <View className={`${ultraCompact ? 'mt-3' : 'mt-4'} rounded-2xl border border-imperial-gold/20 bg-white/70 ${ultraCompact ? 'p-2.5' : compact ? 'p-3' : 'p-4'}`}>
            <Text numberOfLines={ultraCompact ? 3 : 4} className={`${ultraCompact ? 'text-[11px] leading-4' : compact ? 'text-xs leading-5' : 'text-sm leading-5'} text-stone-600`}>
              {mode === GameMode.INICIANTE
                ? 'Você receberá conselhos durante o turno e enfrentará bots menos punitivos para aprender o jogo.'
                : mode === GameMode.AVANCADO
                  ? 'Espere mais blefes, bloqueios e contestações. A corte avançada pune hesitação.'
                  : 'Todos começam com 2 moedas e 2 influências. Com 10 moedas, o Golpe de Estado é obrigatório.'}
            </Text>
          </View>

          <View className="grow" />

          <View className="pb-4 pt-3">
            <TouchableOpacity
              activeOpacity={0.82}
              className={`${ultraCompact ? 'py-3.5' : 'py-4'} items-center rounded-2xl bg-imperial-green`}
              onPress={startGame}
            >
              <Text className={`${ultraCompact ? 'text-base' : 'text-lg'} font-bold text-imperial-cream`}>Entrar na disputa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
