import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Crown, LogOut, Plus, Radar } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNetworkSession } from '../../network/NetworkSessionStore';
import { CourtPromptModal } from '../components/CourtPromptModal';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Multiplayer'>;
};

export function MultiplayerScreen({ navigation }: Props) {
  const [playerName, setPlayerName] = useState('');
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [promptState, setPromptState] = useState<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    buttons: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'destructive' }[];
  } | null>(null);
  const lobby = useNetworkSession((state) => state.lobby);
  const playerId = useNetworkSession((state) => state.playerId);
  const leave = useNetworkSession((state) => state.leave);
  const normalizedName = playerName.trim();
  const self = lobby?.players.find((player) => player.id === playerId);
  const hasActiveRoom = Boolean(lobby && self?.isHost);

  const closeActiveRoom = async () => {
    await leave();
    setPromptState({
      title: 'Mesa encerrada',
      subtitle: 'Sua mesa foi removida da rede local.',
      icon: <LogOut color="#7F1D1D" size={20} />,
      buttons: [
        {
          label: 'Continuar',
          onPress: () => {
            setPromptState(null);
            navigation.popToTop();
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-night-deep' : 'bg-imperial-cream'}`}>
      {isDark && <NightSky />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6 pb-8"
      >
        <TouchableOpacity
          className={`mt-2 h-12 w-12 items-center justify-center rounded-2xl border ${
            isDark ? 'border-white/10 bg-white/5' : 'border-imperial-brown/15 bg-white'
          }`}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={isDark ? '#FFFFFF' : '#5E412F'} size={26} />
        </TouchableOpacity>

        <View className="mt-10">
          <Text className={`text-xs font-bold uppercase tracking-[3px] ${isDark ? 'text-imperial-gold' : 'text-imperial-green'}`}>
            Multiplayer LAN
          </Text>
          <Text className={`mt-2 text-4xl font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Sua identidade</Text>
          <Text className={`mt-3 text-base leading-6 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            Todos os dispositivos precisam estar na mesma rede Wi-Fi.
          </Text>
        </View>

        <Text className={`mb-2 mt-10 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
          Nome do jogador
        </Text>
        <TextInput
          autoFocus
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
          placeholder="Ex.: Gabriel"
          placeholderTextColor="#A8A29E"
          className={`rounded-2xl border px-5 py-4 text-lg font-bold ${
            isDark ? 'border-white/10 bg-white/5 text-white' : 'border-imperial-gold/25 bg-white text-imperial-brown'
          }`}
        />

        {hasActiveRoom && lobby && (
          <View className={`mt-6 rounded-2xl border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/25 bg-white'
          }`}>
            <View className="flex-row items-center">
              <View className={`h-11 w-11 items-center justify-center rounded-xl ${isDark ? 'bg-imperial-gold/10' : 'bg-amber-50'}`}>
                <Crown color={isDark ? '#C9A227' : '#A56E12'} size={22} />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{lobby.table.name}</Text>
                <Text className={`mt-1 text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Mesa ativa na rede local, aguardando jogadores.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.replace('Lobby')}
              className={`mt-4 items-center rounded-2xl py-4 ${isDark ? 'bg-imperial-gold' : 'bg-imperial-green'}`}
            >
              <Text className={`font-bold ${isDark ? 'text-night-deep' : 'text-imperial-cream'}`}>Voltar ao lobby</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeActiveRoom}
              className={`mt-3 items-center rounded-2xl border py-4 ${
                isDark ? 'border-red-500/30 bg-red-900/20' : 'border-red-200 bg-white'
              }`}
            >
              <Text className="font-bold text-red-800">Encerrar mesa</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-1" />

        <TouchableOpacity
          disabled={!normalizedName || hasActiveRoom}
          onPress={() => navigation.navigate('CreateMatch', { playerName: normalizedName })}
          className={`mb-3 flex-row items-center justify-center rounded-2xl py-5 ${
            normalizedName && !hasActiveRoom
              ? isDark ? 'bg-imperial-gold' : 'bg-imperial-green'
              : isDark ? 'bg-white/10' : 'bg-stone-300'
          }`}
        >
          <Plus color={isDark ? '#0B1026' : '#F5F0E6'} size={22} />
          <Text className={`ml-3 text-lg font-bold ${isDark ? 'text-night-deep' : 'text-imperial-cream'}`}>Criar partida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!normalizedName || hasActiveRoom}
          onPress={() => navigation.navigate('FindMatch', { playerName: normalizedName })}
          className={`flex-row items-center justify-center rounded-2xl border py-5 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-imperial-brown/25 bg-white'
          }`}
        >
          <Radar color={normalizedName && !hasActiveRoom ? (isDark ? '#FFFFFF' : '#5E412F') : '#A8A29E'} size={22} />
          <Text
            className={`ml-3 text-lg font-bold ${
              normalizedName && !hasActiveRoom
                ? isDark ? 'text-white' : 'text-imperial-brown'
                : 'text-stone-400'
            }`}
          >
            Encontrar partida
          </Text>
        </TouchableOpacity>

        <CourtPromptModal
          visible={Boolean(promptState)}
          title={promptState?.title ?? ''}
          subtitle={promptState?.subtitle}
          onClose={() => setPromptState(null)}
          icon={promptState?.icon}
          buttons={promptState?.buttons ?? []}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
