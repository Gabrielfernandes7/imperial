import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Player } from '../../game/models/Player';
import { BOT_PERSONALITIES, BotPersonalityType } from '../../game/models/BotPersonality';
import { InfluenceCard } from './InfluenceCard';
import { CoinCounter } from './CoinCounter';

import { useThemeStore } from '../../store/themeStore';

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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const canSelectCard = Boolean(selectionMode);

  const selectionLabel =
    selectionMode === 'exchange'
      ? 'Troque de cartas!'
      : selectionMode === 'spy'
        ? 'Escolha 1 carta para espiar'
        : 'Escolha uma carta para revelar!';

  const getContainerStyles = () => {
    if (isDark) {
      if (isCurrent) return 'border-imperial-gold bg-night-accent';
      if (canSelectCard) return 'border-imperial-gold/70 bg-night-accent';
      return 'border-white/15 bg-night-mid';
    } else {
      if (isCurrent) return 'border-imperial-gold bg-imperial-gold/10';
      if (canSelectCard) return 'border-imperial-green/50 bg-imperial-green/5';
      return 'border-transparent bg-white';
    }
  };

  return (
    <View 
      className={`p-3 rounded-xl mb-2 border-2 shadow-sm ${getContainerStyles()} ${!player.alive ? 'opacity-50 grayscale' : ''}`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Text className={`text-base font-bold ${isDark ? (isCurrent ? 'text-imperial-gold' : 'text-white') : (isCurrent ? 'text-imperial-brown' : 'text-text')}`}>
            {player.name} {isUser ? '(Você)' : ''}
          </Text>
          {!player.alive && (
            <Text className={`ml-2 text-[8px] font-bold uppercase border px-1 rounded ${isDark ? 'text-red-400 bg-red-900/30 border-red-900/50' : 'text-red-600 bg-red-50 border-red-100'}`}>Eliminado</Text>
          )}
          {canSelectCard && (
            <Text className={`ml-2 text-[10px] font-bold animate-pulse ${selectionMode === 'spy' ? (isDark ? 'text-blue-400' : 'text-blue-600') : player.influences.length > 2 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                {selectionLabel}
            </Text>
          )}
        </View>
        
        <CoinCounter amount={player.coins} compact />
      </View>

      {player.isBot && player.botPersonality && (
        <BotPersonalityBadge type={player.botPersonality} />
      )}

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

function BotPersonalityBadge({ type }: { type: BotPersonalityType }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const personality = BOT_PERSONALITIES[type];

  return (
    <View className={`mb-3 rounded-xl border px-3 py-2 ${
      isDark ? 'border-imperial-gold/25 bg-night-accent' : 'border-imperial-gold/25 bg-amber-50'
    }`}>
      <Text className={`text-[10px] font-black uppercase tracking-[2px] ${
        isDark ? 'text-imperial-gold' : 'text-imperial-green'
      }`}>
        {personality.name} · {personality.tagline}
      </Text>
      <Text className={`mt-1 text-[11px] leading-4 ${
        isDark ? 'text-stone-300' : 'text-stone-600'
      }`}>
        {personality.tableRead}
      </Text>
    </View>
  );
}
