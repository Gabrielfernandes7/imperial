import './tailwind.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from './src/store/themeStore';

export default function App() {
  const { setColorScheme } = useColorScheme();
  const { theme } = useThemeStore();

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
