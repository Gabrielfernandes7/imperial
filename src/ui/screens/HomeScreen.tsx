import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Crown, Info, Moon, Sun, Swords, Wifi } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-night-deep' : 'bg-imperial-cream'}`}>
      {isDark && <NightSky />}
      
      {!isDark && (
        <>
          <View className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-imperial-gold/15" />
          <View className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-imperial-green/10" />
        </>
      )}

      {/* Theme Toggle */}
      <TouchableOpacity 
        onPress={toggleTheme}
        className="absolute right-6 top-16 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20"
      >
        {isDark ? <Sun color="#FDB813" size={20} /> : <Moon color="#5E412F" size={20} />}
      </TouchableOpacity>

      <View className={`flex-1 m-3 border ${isDark ? 'border-white/10' : 'border-imperial-gold/25'} rounded-[24px] p-1`}>
        <View className={`flex-1 border ${isDark ? 'border-white/20 bg-night-mid/40' : 'border-imperial-gold/40'} rounded-[18px] px-5 py-6 justify-between`}>
          <View className="flex-1 justify-center">
            <View className={`mb-6 h-20 w-20 items-center justify-center rounded-3xl border ${isDark ? 'border-white/20 bg-white/5' : 'border-imperial-gold/40 bg-white'} shadow-sm`}>
              <Crown color={isDark ? "#C9A227" : "#A56E12"} size={42} strokeWidth={1.7} />
            </View>
            <Text className={`text-xs font-bold uppercase tracking-[4px] ${isDark ? 'text-imperial-gold' : 'text-imperial-green'}`}>
              Intriga & Poder no Brasil Oitocentista
            </Text>
            <Text className={`mt-2 text-6xl font-black leading-[62px] ${isDark ? 'text-white' : 'text-imperial-brown'}`}>
              IMPERIAL
            </Text>
            <Text className={`mt-4 max-w-sm text-base leading-6 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              Um jogo de intriga política no Brasil Imperial. Blefe, influência e disputa pelo poder contra a corte.
            </Text>

            <View className="mt-8 flex-row">
              <View className={`mr-3 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/25 bg-white/80'} px-4 py-2.5`}>
                <Text className={`text-xs font-bold ${isDark ? 'text-stone-300' : 'text-imperial-brown'}`}>2-3 Jogadores</Text>
              </View>
              <View className={`rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/25 bg-white/80'} px-4 py-2.5`}>
                <Text className={`text-xs font-bold ${isDark ? 'text-stone-300' : 'text-imperial-brown'}`}>10-20 Minutos</Text>
              </View>
            </View>
          </View>

          <View className="w-full">
            <TouchableOpacity
              activeOpacity={0.82}
              className={`mb-3 flex-row items-center justify-center rounded-2xl ${isDark ? 'bg-imperial-gold' : 'bg-imperial-green'} py-5 shadow-sm`}
              onPress={() => navigation.navigate('NewGame')}
            >
              <Swords color={isDark ? "#0B1026" : "#F5F0E6"} size={22} />
              <Text className={`ml-3 text-lg font-bold ${isDark ? 'text-night-deep' : 'text-imperial-cream'}`}>Iniciar Partida</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              className={`mb-3 flex-row items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 border border-white/20' : 'bg-imperial-brown'} py-5 shadow-sm`}
              onPress={() => navigation.navigate('Multiplayer')}
            >
              <Wifi color={isDark ? "#FFFFFF" : "#F5F0E6"} size={22} />
              <Text className={`ml-3 text-lg font-bold ${isDark ? 'text-white' : 'text-imperial-cream'}`}>Multiplayer LAN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              className={`flex-row items-center justify-center rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-imperial-brown/25 bg-white/70'} py-4 shadow-sm`}
              onPress={() => navigation.navigate('About')}
            >
              <Info color={isDark ? "#FFFFFF" : "#5E412F"} size={20} />
              <Text className={`ml-2 font-bold ${isDark ? 'text-stone-200' : 'text-imperial-brown'}`}>Regras e Personagens</Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <Text className={`mt-4 text-center text-[10px] uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'} font-bold`}>
                Modo Solo e Multiplayer Local
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
