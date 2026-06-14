import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Player } from '../../game/models/Player';
import { InfluenceCard } from './InfluenceCard';
import { CoinCounter } from './CoinCounter';

interface PlayerCardProps {
  player: Player;
  isCurrent: boolean;
  isUser: boolean;
  selectionMode?: 'reveal' | 'exchange' | 'spy';
  selectedCardIds?: string[];
  onSelectCard?: (influenceId: string) => void;
  visibleInfluenceIds?: string[];
  onTogglePrivateView?: (influenceId: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isCurrent, 
  isUser, 
  selectionMode,
  selectedCardIds = [],
  onSelectCard,
  visibleInfluenceIds = [],
  onTogglePrivateView,
}) => {
  const canSelectCard = Boolean(selectionMode);

  const selectionLabel =
    selectionMode === 'exchange'
      ? 'Troque de cartas!'
      : selectionMode === 'spy'
        ? 'Escolha 1 carta para espiar'
        : 'Escolha uma carta para revelar!';

  return (
    <View 
      className={`p-3 rounded-xl mb-2 border-2 shadow-sm ${
        isCurrent ? 'border-imperial-gold bg-imperial-gold/10' : 'border-transparent bg-white'
      } ${!player.alive ? 'opacity-50 grayscale' : ''} ${canSelectCard ? 'border-imperial-green/50 bg-imperial-green/5' : ''}`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Text className={`text-base font-bold ${isCurrent ? 'text-imperial-brown' : 'text-text'}`}>
            {player.name} {isUser ? '(Você)' : ''}
          </Text>
          {!player.alive && (
            <Text className="ml-2 text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded uppercase border border-red-100">Eliminado</Text>
          )}
          {canSelectCard && (
            <Text className={`ml-2 text-[10px] font-bold animate-pulse ${selectionMode === 'spy' ? 'text-blue-600' : player.influences.length > 2 ? 'text-blue-600' : 'text-red-600'}`}>
                {selectionLabel}
            </Text>
          )}
        </View>
        
        <CoinCounter amount={player.coins} compact />
      </View>

      <View className="flex-row gap-x-8">
        {player.influences.map((inf) => {
          const isSelected = selectedCardIds.includes(inf.id);
          const forceFaceDown =
            isUser &&
            !inf.revealed &&
            !canSelectCard &&
            !visibleInfluenceIds.includes(inf.id);

          return (
            <TouchableOpacity 
              key={inf.id} 
              className="flex-1 rounded-xl"
              disabled={(!canSelectCard && !onTogglePrivateView) || inf.revealed}
              onPress={() => {
                if (canSelectCard) {
                  onSelectCard?.(inf.id);
                  return;
                }
                if (isUser && !inf.revealed) {
                  onTogglePrivateView?.(inf.id);
                }
              }}
            >
              <InfluenceCard 
                influence={inf} 
                isOwner={isUser}
                forceFaceDown={forceFaceDown}
                highlighted={(canSelectCard && !inf.revealed) || isSelected}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
