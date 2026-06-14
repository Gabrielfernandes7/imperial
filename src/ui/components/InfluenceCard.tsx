import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { Influence } from '../../game/models/Influence';
import { Crown } from 'lucide-react-native';

type CardInfluence = Pick<Influence, 'id' | 'revealed'> & {
  character?: Influence['character'];
};

interface InfluenceCardProps {
  influence: CardInfluence;
  isOwner: boolean;
  highlighted?: boolean;
  forceFaceDown?: boolean;
}

export const CARD_IMAGES: Record<string, any> = {
  DUQUE: require('../../../assets/cartas/barao_do_cafe.png'),
  ASSASSINO: require('../../../assets/cartas/capanga.png'),
  CAPITAO: require('../../../assets/cartas/corsario.png'),
  EMBAIXADOR: require('../../../assets/cartas/diplomata.png'),
  CONDESSA: require('../../../assets/cartas/marquesa.png'),
};

export const InfluenceCard: React.FC<InfluenceCardProps> = ({
  influence,
  isOwner,
  highlighted = false,
  forceFaceDown = false,
}) => {
  const isRevealed = influence.revealed;
  const showFront =
    !forceFaceDown &&
    Boolean(influence.character) &&
    (isRevealed || isOwner);

  if (showFront) {
    const cardImage = CARD_IMAGES[influence.character!.type];

    return (
      <View
        className={`rounded-xl overflow-hidden border-2 shadow-sm ${
          isRevealed
            ? 'border-red-400 opacity-60'
            : highlighted
              ? 'border-imperial-green'
              : 'border-imperial-gold/30'
        }`}
        style={{
          width: '85%',
          aspectRatio: 0.65,
          alignSelf: 'center',
        }}
      >
        <ImageBackground
          source={cardImage}
          className="flex-1 justify-end"
          resizeMode="cover"
        >
          <View className="bg-black/60 px-1.5 py-1">
            <Text
              className={`text-[9px] font-black text-center uppercase tracking-wide ${
                isRevealed ? 'text-red-400' : 'text-imperial-cream'
              }`}
              numberOfLines={1}
            >
              {influence.character!.name}
            </Text>

            {isOwner && !isRevealed && (
              <Text
                className="text-[6px] text-stone-300 text-center leading-tight mt-0.5"
                numberOfLines={2}
              >
                {influence.character!.description.split('.')[0]}
              </Text>
            )}

            {isRevealed && (
              <Text
                className="text-[6px] text-red-300 text-center font-bold uppercase"
                numberOfLines={1}
              >
                Revelado
              </Text>
            )}
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View
      className={`rounded-xl border-2 items-center justify-center p-1.5 bg-imperial-brown ${
        highlighted
          ? 'border-imperial-gold'
          : 'border-imperial-brown shadow-inner'
      }`}
      style={{
        width: '85%',
        aspectRatio: 0.65,
        alignSelf: 'center',
      }}
    >
      <View className="border border-imperial-gold/30 rounded-lg flex-1 w-full items-center justify-center bg-stone-900/10">
        <Crown color="#C9A227" size={18} strokeWidth={1.5} />
        <Text className="text-[6px] font-black text-imperial-gold/80 uppercase tracking-widest mt-1 text-center">
          Imperial
        </Text>
      </View>
    </View>
  );
};