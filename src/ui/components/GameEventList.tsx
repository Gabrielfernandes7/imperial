import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { GameEvent } from '../../game/models/GameEvent';

interface GameEventListProps {
  events: GameEvent[];
}

export const GameEventList: React.FC<GameEventListProps> = ({ events }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when new events arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [events.length]);

  return (
    <View className="h-24 bg-white rounded-xl border border-imperial-gold/20 overflow-hidden shadow-inner">
      <View className="bg-imperial-gold/10 px-3 py-1 border-b border-imperial-gold/10">
        <Text className="text-[10px] font-bold text-imperial-brown uppercase tracking-widest">
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
            <Text className="text-[10px] font-bold text-imperial-brown/50 mr-2 w-4">
              {event.turn}
            </Text>
            <Text className="text-xs text-text flex-1">
              {(event as any).description || formatEventDescription(event)}
            </Text>
          </View>
        ))}
        {events.length === 0 && (
          <Text className="text-xs text-text/40 italic text-center mt-4">
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
