import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, RefreshCw, ShieldAlert, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiscoveryClient } from '../../network/client/DiscoveryClient';
import { TableSummary } from '../../network/models/NetworkPlayer';
import { useNetworkSession } from '../../network/NetworkSessionStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CourtPromptModal } from '../components/CourtPromptModal';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FindMatch'>;
  route: RouteProp<RootStackParamList, 'FindMatch'>;
};

export function FindMatchScreen({ navigation, route }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const discoveryRef = useRef(new DiscoveryClient());
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [promptState, setPromptState] = useState<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    buttons: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'destructive' }[];
  } | null>(null);
  const joinTable = useNetworkSession((state) => state.joinTable);
  const lobby = useNetworkSession((state) => state.lobby);

  const search = async () => {
    setTables([]);
    setSearching(true);
    try {
      await discoveryRef.current.discover((table) => {
        setTables((current) =>
          current.some((item) => item.id === table.id) ? current : [...current, table],
        );
      });
    } catch (error) {
      setPromptState({
        title: 'Descoberta indisponível',
        subtitle: error instanceof Error ? error.message : 'Erro desconhecido.',
        icon: <ShieldAlert color="#991B1B" size={20} />,
        buttons: [{ label: 'OK', onPress: () => setPromptState(null) }],
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    search();
    return () => discoveryRef.current.cancel();
  }, []);

  useEffect(() => {
    if (lobby) {
      navigation.replace('Lobby');
    }
  }, [lobby, navigation]);

  const join = async (table: TableSummary) => {
    try {
      discoveryRef.current.cancel();
      setSearching(false);
      await joinTable(route.params.playerName, table);
    } catch (error) {
      setPromptState({
        title: 'Não foi possível entrar',
        subtitle: error instanceof Error ? error.message : 'Erro desconhecido.',
        icon: <ShieldAlert color="#991B1B" size={20} />,
        buttons: [{ label: 'OK', onPress: () => setPromptState(null) }],
      });
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-night-deep' : 'bg-imperial-cream'}`}>
      {isDark && <NightSky />}
      <View className="flex-row items-center justify-between px-6 pt-2">
        <TouchableOpacity
          className={`h-12 w-12 items-center justify-center rounded-2xl border ${
            isDark ? 'border-white/10 bg-white/5' : 'border-imperial-brown/15 bg-white'
          }`}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={isDark ? '#FFFFFF' : '#5E412F'} size={26} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={search}
          disabled={searching}
          className={`h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-imperial-gold' : 'bg-imperial-green'}`}
        >
          {searching ? (
            <ActivityIndicator color={isDark ? '#0B1026' : '#F5F0E6'} />
          ) : (
            <RefreshCw color={isDark ? '#0B1026' : '#F5F0E6'} size={22} />
          )}
        </TouchableOpacity>
      </View>
      <View className="px-6 pt-8">
        <Text className={`text-xs font-bold uppercase tracking-[3px] ${isDark ? 'text-imperial-gold' : 'text-imperial-green'}`}>
          Rede local
        </Text>
        <Text className={`mt-2 text-4xl font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Mesas abertas</Text>
        <Text className={`mt-3 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>Procurando Hosts na mesma rede Wi-Fi.</Text>
      </View>
      <ScrollView className="mt-8 flex-1 px-6">
        {tables.map((table) => (
          <TouchableOpacity
            key={table.id}
            onPress={() => join(table)}
            className={`mb-3 flex-row items-center rounded-2xl border p-5 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/25 bg-white'
            }`}
          >
            <View className={`h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-imperial-gold/10' : 'bg-emerald-50'}`}>
              <Users color={isDark ? '#C9A227' : '#1E5631'} size={24} />
            </View>
            <View className="ml-4 flex-1">
              <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{table.name}</Text>
              <Text className={`mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {table.playerCount}/{table.maxPlayers} jogadores
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {!searching && tables.length === 0 && (
          <View className={`rounded-2xl border border-dashed p-8 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-stone-300'
          }`}>
            <Text className={`text-center font-bold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Nenhuma mesa aberta foi encontrada.
            </Text>
          </View>
        )}
      </ScrollView>

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
