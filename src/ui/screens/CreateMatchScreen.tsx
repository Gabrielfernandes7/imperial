import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ShieldAlert } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkSession } from '../../network/NetworkSessionStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CourtPromptModal } from '../components/CourtPromptModal';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateMatch'>;
  route: RouteProp<RootStackParamList, 'CreateMatch'>;
};

export function CreateMatchScreen({ navigation, route }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [tableName, setTableName] = useState(`Mesa de ${route.params.playerName}`);
  const [creating, setCreating] = useState(false);
  const [promptState, setPromptState] = useState<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    buttons: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'destructive' }[];
  } | null>(null);
  const lobby = useNetworkSession((state) => state.lobby);
  const createHost = useNetworkSession((state) => state.createHost);

  useEffect(() => {
    if (creating && lobby) {
      navigation.replace('Lobby');
    }
  }, [creating, lobby, navigation]);

  const create = async () => {
    setCreating(true);
    try {
      await createHost(route.params.playerName, tableName);
    } catch (error) {
      setCreating(false);
      setPromptState({
        title: 'Não foi possível criar a mesa',
        subtitle: error instanceof Error ? error.message : 'Erro desconhecido.',
        icon: <ShieldAlert color="#991B1B" size={20} />,
        buttons: [{ label: 'OK', onPress: () => setPromptState(null) }],
      });
    }
  };

  return (
    <SafeAreaView className={`flex-1 px-6 pb-8 ${isDark ? 'bg-night-deep' : 'bg-imperial-cream'}`}>
      {isDark && <NightSky />}
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
          Nova mesa
        </Text>
        <Text className={`mt-2 text-4xl font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Criar partida</Text>
      </View>
      <Text className={`mb-2 mt-10 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
        Nome da mesa
      </Text>
      <TextInput
        value={tableName}
        onChangeText={setTableName}
        maxLength={32}
        className={`rounded-2xl border px-5 py-4 text-lg font-bold ${
          isDark ? 'border-white/10 bg-white/5 text-white' : 'border-imperial-gold/25 bg-white text-imperial-brown'
        }`}
      />
      <View className="flex-1" />
      <TouchableOpacity
        disabled={creating || !tableName.trim()}
        onPress={create}
        className={`items-center rounded-2xl py-5 ${
          isDark ? 'bg-imperial-gold' : 'bg-imperial-green'
        }`}
      >
        {creating ? (
          <ActivityIndicator color={isDark ? '#0B1026' : '#F5F0E6'} />
        ) : (
          <Text className={`text-lg font-bold ${isDark ? 'text-night-deep' : 'text-imperial-cream'}`}>Abrir mesa na rede</Text>
        )}
      </TouchableOpacity>

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
