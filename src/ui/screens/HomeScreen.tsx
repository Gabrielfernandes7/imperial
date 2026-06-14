import React from 'react';
import { Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Crown, Info, Swords, Wifi } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-imperial-cream">
      <StatusBar barStyle="dark-content" />
      <View className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-imperial-gold/15" />
      <View className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-imperial-green/10" />

      <View className="flex-1 m-3 border border-imperial-gold/25 rounded-[24px] p-1">
        <View className="flex-1 border border-imperial-gold/40 rounded-[18px] px-5 py-6 justify-between">
          <View className="flex-1 justify-center">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl border border-imperial-gold/40 bg-white shadow-sm">
              <Crown color="#A56E12" size={42} strokeWidth={1.7} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-[4px] text-imperial-green">
              Intriga & Poder no Brasil Oitocentista
            </Text>
            <Text className="mt-2 text-6xl font-black leading-[62px] text-imperial-brown">
              IMPERIAL
            </Text>
            <Text className="mt-4 max-w-sm text-base leading-6 text-stone-600">
              Um jogo de intriga política no Brasil Imperial. Blefe, influência e disputa pelo poder contra a corte.
            </Text>

            <View className="mt-8 flex-row">
              <View className="mr-3 rounded-2xl border border-imperial-gold/25 bg-white/80 px-4 py-2.5">
                <Text className="text-xs font-bold text-imperial-brown">2-3 Jogadores</Text>
              </View>
              <View className="rounded-2xl border border-imperial-gold/25 bg-white/80 px-4 py-2.5">
                <Text className="text-xs font-bold text-imperial-brown">10-20 Minutos</Text>
              </View>
            </View>
          </View>

          <View className="w-full">
            <TouchableOpacity
              activeOpacity={0.82}
              className="mb-3 flex-row items-center justify-center rounded-2xl bg-imperial-green py-5 shadow-sm"
              onPress={() => navigation.navigate('NewGame')}
            >
              <Swords color="#F5F0E6" size={22} />
              <Text className="ml-3 text-lg font-bold text-imperial-cream">Iniciar Partida</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              className="mb-3 flex-row items-center justify-center rounded-2xl bg-imperial-brown py-5 shadow-sm"
              onPress={() => navigation.navigate('Multiplayer')}
            >
              <Wifi color="#F5F0E6" size={22} />
              <Text className="ml-3 text-lg font-bold text-imperial-cream">Multiplayer LAN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              className="flex-row items-center justify-center rounded-2xl border border-imperial-brown/25 bg-white/70 py-4 shadow-sm"
              onPress={() => navigation.navigate('About')}
            >
              <Info color="#5E412F" size={20} />
              <Text className="ml-2 font-bold text-imperial-brown">Regras e Personagens</Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <Text className="mt-4 text-center text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                Modo Solo e Multiplayer Local
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
