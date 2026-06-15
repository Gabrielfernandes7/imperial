import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { GameEvent } from '../../game/models/GameEvent';

import { useThemeStore } from '../../store/themeStore';

interface GameEventListProps {
  events: GameEvent[];
}

export const GameEventList: React.FC<GameEventListProps> = ({ events }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Scroll to bottom when new events arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [events.length]);

  return (
    <View className={`h-24 rounded-xl border overflow-hidden shadow-inner ${isDark ? 'bg-night-mid/80 border-white/10' : 'bg-white border-imperial-gold/20'}`}>
      <View className={`px-3 py-1 border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-imperial-gold/10 border-imperial-gold/10'}`}>
        <Text className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-imperial-gold' : 'text-imperial-brown'}`}>
          Diário da Corte
        </Text>
      </View>
      <ScrollView 
        ref={scrollViewRef} 
        className="p-3"
        contentContainerStyle={{ paddingBottom: 12 }}
      >
        {events.map((event, index) => (
          <View key={event.id} className="mb-2 flex-row">
            <Text className={`text-[10px] font-bold mr-2 w-4 ${isDark ? 'text-stone-500' : 'text-imperial-brown/50'}`}>
              {event.turn}
            </Text>
            <Text className={`text-xs flex-1 ${isDark ? 'text-stone-300' : 'text-text'}`}>
              {(event as any).description || formatEventDescription(event)}
            </Text>
          </View>
        ))}
        {events.length === 0 && (
          <Text className={`text-xs italic text-center mt-4 ${isDark ? 'text-stone-600' : 'text-text/40'}`}>
            Aguardando eventos...
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

// Fallback formatter for GameEvents from Simulation sprint
function formatEventDescription(event: GameEvent | any): string {
    // Basic logic to format the events based on type if 'description' is missing
    return `Evento: ${event.type}`;
}
