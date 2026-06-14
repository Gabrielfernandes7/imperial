import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Crown, LogOut, Plus, Radar } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNetworkSession } from '../../network/NetworkSessionStore';
import { CourtPromptModal } from '../components/CourtPromptModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Multiplayer'>;
};

export function MultiplayerScreen({ navigation }: Props) {
  const [playerName, setPlayerName] = useState('');
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
    <SafeAreaView className="flex-1 bg-imperial-cream">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6 pb-8"
      >
        <TouchableOpacity
          className="mt-2 h-12 w-12 items-center justify-center rounded-2xl border border-imperial-brown/15 bg-white"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color="#5E412F" size={26} />
        </TouchableOpacity>

        <View className="mt-10">
          <Text className="text-xs font-bold uppercase tracking-[3px] text-imperial-green">
            Multiplayer LAN
          </Text>
          <Text className="mt-2 text-4xl font-black text-imperial-brown">Sua identidade</Text>
          <Text className="mt-3 text-base leading-6 text-stone-600">
            Todos os dispositivos precisam estar na mesma rede Wi-Fi.
          </Text>
        </View>

        <Text className="mb-2 mt-10 text-xs font-bold uppercase tracking-widest text-stone-500">
          Nome do jogador
        </Text>
        <TextInput
          autoFocus
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
          placeholder="Ex.: Gabriel"
          placeholderTextColor="#A8A29E"
          className="rounded-2xl border border-imperial-gold/25 bg-white px-5 py-4 text-lg font-bold text-imperial-brown"
        />

        {hasActiveRoom && lobby && (
          <View className="mt-6 rounded-2xl border border-imperial-gold/25 bg-white p-4">
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <Crown color="#A56E12" size={22} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-black text-imperial-brown">{lobby.table.name}</Text>
                <Text className="mt-1 text-xs text-stone-500">
                  Mesa ativa na rede local, aguardando jogadores.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.replace('Lobby')}
              className="mt-4 items-center rounded-2xl bg-imperial-green py-4"
            >
              <Text className="font-bold text-imperial-cream">Voltar ao lobby</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeActiveRoom}
              className="mt-3 items-center rounded-2xl border border-red-200 bg-white py-4"
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
            normalizedName && !hasActiveRoom ? 'bg-imperial-green' : 'bg-stone-300'
          }`}
        >
          <Plus color="#F5F0E6" size={22} />
          <Text className="ml-3 text-lg font-bold text-imperial-cream">Criar partida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!normalizedName || hasActiveRoom}
          onPress={() => navigation.navigate('FindMatch', { playerName: normalizedName })}
          className="flex-row items-center justify-center rounded-2xl border border-imperial-brown/25 bg-white py-5"
        >
          <Radar color={normalizedName && !hasActiveRoom ? '#5E412F' : '#A8A29E'} size={22} />
          <Text
            className={`ml-3 text-lg font-bold ${
              normalizedName && !hasActiveRoom ? 'text-imperial-brown' : 'text-stone-400'
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
