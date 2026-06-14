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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FindMatch'>;
  route: RouteProp<RootStackParamList, 'FindMatch'>;
};

export function FindMatchScreen({ navigation, route }: Props) {
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
    <SafeAreaView className="flex-1 bg-imperial-cream">
      <View className="flex-row items-center justify-between px-6 pt-2">
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-2xl border border-imperial-brown/15 bg-white"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color="#5E412F" size={26} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={search}
          disabled={searching}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-imperial-green"
        >
          {searching ? (
            <ActivityIndicator color="#F5F0E6" />
          ) : (
            <RefreshCw color="#F5F0E6" size={22} />
          )}
        </TouchableOpacity>
      </View>
      <View className="px-6 pt-8">
        <Text className="text-xs font-bold uppercase tracking-[3px] text-imperial-green">
          Rede local
        </Text>
        <Text className="mt-2 text-4xl font-black text-imperial-brown">Mesas abertas</Text>
        <Text className="mt-3 text-stone-600">Procurando Hosts na mesma rede Wi-Fi.</Text>
      </View>
      <ScrollView className="mt-8 flex-1 px-6">
        {tables.map((table) => (
          <TouchableOpacity
            key={table.id}
            onPress={() => join(table)}
            className="mb-3 flex-row items-center rounded-2xl border border-imperial-gold/25 bg-white p-5"
          >
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <Users color="#1E5631" size={24} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-black text-imperial-brown">{table.name}</Text>
              <Text className="mt-1 text-stone-500">
                {table.playerCount}/{table.maxPlayers} jogadores
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {!searching && tables.length === 0 && (
          <View className="rounded-2xl border border-dashed border-stone-300 p-8">
            <Text className="text-center font-bold text-stone-500">
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
