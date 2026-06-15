import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { NewGameScreen } from '../screens/NewGameScreen';
import { GameScreen } from '../screens/GameScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { MatchResultScreen } from '../screens/MatchResultScreen';
import { MultiplayerScreen } from '../screens/MultiplayerScreen';
import { CreateMatchScreen } from '../screens/CreateMatchScreen';
import { FindMatchScreen } from '../screens/FindMatchScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { LanGameScreen } from '../screens/LanGameScreen';
import { GameMode } from '../../game/models/GameMode';
import { useThemeStore } from '../../store/themeStore';

export type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  Multiplayer: undefined;
  CreateMatch: { playerName: string };
  FindMatch: { playerName: string };
  Lobby: undefined;
  LanGame: undefined;
  Game: { playerNames: string[]; mode: GameMode };
  About: undefined;
  MatchResult: {
    winnerId: string;
    winnerName: string;
    humanPlayerId: string;
    totalTurns: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0B1026' : '#FAF8F3' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="NewGame" component={NewGameScreen} />
      <Stack.Screen name="Multiplayer" component={MultiplayerScreen} />
      <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
      <Stack.Screen name="FindMatch" component={FindMatchScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="LanGame" component={LanGameScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="MatchResult" component={MatchResultScreen} />
    </Stack.Navigator>
  );
};
