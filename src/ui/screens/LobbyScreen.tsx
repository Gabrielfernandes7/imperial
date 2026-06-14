import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Crown, LogOut, ShieldAlert, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkSession } from '../../network/NetworkSessionStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CourtPromptModal } from '../components/CourtPromptModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lobby'>;
};

export function LobbyScreen({ navigation }: Props) {
  const lobby = useNetworkSession((state) => state.lobby);
  const snapshot = useNetworkSession((state) => state.snapshot);
  const playerId = useNetworkSession((state) => state.playerId);
  const error = useNetworkSession((state) => state.error);
  const clearError = useNetworkSession((state) => state.clearError);
  const setReady = useNetworkSession((state) => state.setReady);
  const startMatch = useNetworkSession((state) => state.startMatch);
  const leave = useNetworkSession((state) => state.leave);
  const [promptState, setPromptState] = React.useState<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    buttons: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'destructive' }[];
  } | null>(null);

  useEffect(() => {
    if (snapshot) {
      navigation.replace('LanGame');
    }
  }, [navigation, snapshot]);

  useEffect(() => {
    if (error) {
      setPromptState({
        title: 'Mesa',
        subtitle: error,
        icon: <ShieldAlert color="#991B1B" size={20} />,
        buttons: [{ label: 'OK', onPress: () => { setPromptState(null); clearError(); } }],
      });
    }
  }, [clearError, error]);

  if (!lobby || !playerId) {
    return null;
  }

  const self = lobby.players.find((player) => player.id === playerId)!;
  const canStart =
    self.isHost &&
    lobby.players.length >= 2 &&
    lobby.players.every((player) => player.connected && player.ready);

  const exit = async () => {
    await leave();
    navigation.popToTop();
  };

  return (
    <SafeAreaView className="flex-1 bg-imperial-cream px-6 pb-8">
      <View className="flex-row items-center justify-between pt-2">
        <View>
          <Text className="text-xs font-bold uppercase tracking-[3px] text-imperial-green">
            Lobby
          </Text>
          <Text className="mt-2 text-3xl font-black text-imperial-brown">
            {lobby.table.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={exit}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
        >
          <LogOut color="#7F1D1D" size={22} />
        </TouchableOpacity>
      </View>

      <Text className="mt-8 text-xs font-bold uppercase tracking-widest text-stone-500">
        Jogadores {lobby.players.length}/{lobby.table.maxPlayers}
      </Text>
      <View className="mt-3">
        {lobby.players.map((player) => (
          <View
            key={player.id}
            className="mb-3 flex-row items-center rounded-2xl border border-imperial-gold/20 bg-white p-4"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              {player.isHost ? (
                <Crown color="#A56E12" size={23} />
              ) : (
                <User color="#5E412F" size={23} />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-black text-imperial-brown">
                {player.name}{player.id === playerId ? ' (você)' : ''}
              </Text>
              <Text className="mt-1 text-xs text-stone-500">
                {player.isHost ? 'Host da mesa' : player.ready ? 'Pronto' : 'Preparando-se'}
              </Text>
            </View>
            <View
              className={`h-9 w-9 items-center justify-center rounded-full ${
                player.ready ? 'bg-emerald-100' : 'bg-stone-100'
              }`}
            >
              {player.ready && <Check color="#1E5631" size={20} />}
            </View>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      {self.isHost ? (
        <View>
          <TouchableOpacity
            disabled={!canStart}
            onPress={startMatch}
            className={`items-center rounded-2xl py-5 ${
              canStart ? 'bg-imperial-green' : 'bg-stone-300'
            }`}
          >
            <Text className="text-lg font-bold text-white">Iniciar partida</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exit}
            className="mt-3 items-center rounded-2xl border border-red-200 bg-white py-4"
          >
            <Text className="font-bold text-red-800">Encerrar mesa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setReady(!self.ready)}
          className={`items-center rounded-2xl py-5 ${
            self.ready ? 'bg-imperial-brown' : 'bg-imperial-green'
          }`}
        >
          <Text className="text-lg font-bold text-white">
            {self.ready ? 'Cancelar pronto' : 'Estou pronto'}
          </Text>
        </TouchableOpacity>
      )}

      <CourtPromptModal
        visible={Boolean(promptState)}
        title={promptState?.title ?? ''}
        subtitle={promptState?.subtitle}
        onClose={() => setPromptState(null)}
        icon={promptState?.icon}
        buttons={promptState?.buttons ?? []}
      />
    </SafeAreaView>
  );
}
