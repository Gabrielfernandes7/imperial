import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CHARACTERS } from '../../game/models/Character';
import { ACTIONS } from '../../game/models/ActionType';
import { ChevronLeft } from 'lucide-react-native';
import { CARD_IMAGES } from '../components/InfluenceCard';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type AboutScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'About'>;
};

const CHARACTER_ART_CONCEPTS: Record<string, { concept: string; inspiration: string }> = {
  DUQUE: {
    concept: 'Representa a elite cafeeira do Vale do Paraíba. Retratado com expressão firme, casaca oitocentista de corte fino e postura severa.',
    inspiration: 'Pintura realista de Almeida Júnior e retratos fotográficos de Militão Augusto de Azevedo.',
  },
  ASSASSINO: {
    concept: 'O braço armado moldado pela dura realidade rural. Feições marcadas pelo sol do sertão, vestes de couro rústico e medalhas de religiosidade popular.',
    inspiration: 'Expressionismo nordestino de Descartes Gadelha (coleção Cicatrizes Submersas e conflitos de Canudos).',
  },
  CAPITAO: {
    concept: 'O contrabandista audaz dos portos imperiais. Postura confiante, jaqueta naval antiga e chapéu de aba larga.',
    inspiration: 'Fotografia histórica de cais por Marc Ferrez e ornamentos geométricos do cordel.',
  },
  EMBAIXADOR: {
    concept: 'O diplomata da corte oitocentista. Destaque para a casaca formal, faixa imperial verde e amarela e medalhas da Ordem da Rosa ou do Cruzeiro.',
    inspiration: 'Pinturas de retratos oficiais por Victor Meirelles e a Sala do Traje Majestático.',
  },
  CONDESSA: {
    concept: 'Dama da corte com postura elegante e firme, vestindo gola de renda fina e joias do século XIX.',
    inspiration: 'Retratos femininos acadêmicos de Rodolfo Amoedo e a Sala da Imperatriz.',
  },
};

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-night-deep' : 'bg-background'}`} edges={['top', 'left', 'right']}>
      {isDark && <NightSky />}
      <View className={`flex-row items-center border-b p-4 ${
        isDark ? 'border-white/10 bg-night-mid/80' : 'border-imperial-gold/20 bg-white'
      }`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ChevronLeft color={isDark ? '#FFFFFF' : '#5E412F'} size={32} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Sobre o Jogo</Text>
      </View>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className={`mb-2 text-4xl font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Imperial</Text>
          <Text className={`mb-4 text-base leading-6 ${isDark ? 'text-stone-300' : 'text-text'}`}>
            Um jogo de intriga política ambientado no Brasil Imperial, com personagens retratados em pintura digital inspirada no expressionismo nordestino de Descartes Gadelha, na pintura acadêmica brasileira do século XIX e em elementos decorativos da heráldica imperial brasileira.
          </Text>
          <Text className={`text-sm leading-5 ${isDark ? 'text-stone-400' : 'text-text/80'}`}>
            Participe de uma rede de conspiração e blefe nos bastidores da corte oitocentista. Use sua influência política, desmascare os adversários e acumule moedas para desferir o golpe de estado definitivo e consolidar seu poder na corte.
          </Text>
        </View>

        <View className={`mb-8 rounded-2xl border p-5 ${
          isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/20 bg-amber-50/50'
        }`}>
          <Text className={`mb-3 text-lg font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Diretrizes da Direção de Arte</Text>
          <View className="space-y-3">
            <View>
              <Text className="text-xs font-bold text-imperial-green uppercase">1. Pintura Acadêmica e Fotografia</Text>
              <Text className={`mt-0.5 text-xs ${isDark ? 'text-stone-300' : 'text-text/90'}`}>Influência na iluminação dramática, posturas formais e vestimentas detalhadas baseadas nas imagens de Marc Ferrez, Revert Klumb e no acervo do Museu Imperial de Petrópolis.</Text>
            </View>
            <View className="mt-3">
              <Text className="text-xs font-bold text-imperial-green uppercase">2. Expressionismo de Descartes Gadelha</Text>
              <Text className={`mt-0.5 text-xs ${isDark ? 'text-stone-300' : 'text-text/90'}`}>Inspiração nos tons terrosos, expressões faciais profundas e humanização dos personagens, refletindo a dramaticidade histórica brasileira.</Text>
            </View>
            <View className="mt-3">
              <Text className="text-xs font-bold text-imperial-green uppercase">3. Cordel & Xilogravura</Text>
              <Text className={`mt-0.5 text-xs ${isDark ? 'text-stone-300' : 'text-text/90'}`}>Uso de linhas fortes e ornamentos geométricos decorativos em ícones e molduras de interface, inspirados em mestres como J. Borges e Mestre Noza.</Text>
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text className={`mb-4 text-2xl font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Personagens e Arte</Text>
          {Object.values(CHARACTERS).map((char) => {
            const artInfo = CHARACTER_ART_CONCEPTS[char.type];
            const cardImage = CARD_IMAGES[char.type];
            return (
              <View key={char.type} className={`mb-4 flex-row rounded-2xl border p-4 shadow-sm ${
                isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/20 bg-white'
              }`}>
                {cardImage && (
                  <Image 
                    source={cardImage} 
                    className="w-[84px] h-[120px] rounded-xl border border-imperial-gold/30 mr-4" 
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1 flex-wrap">
                    <Text className={`mr-1 text-lg font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{char.name}</Text>
                    <Text className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      isDark ? 'bg-imperial-gold/15 text-imperial-gold' : 'bg-amber-100 text-amber-800'
                    }`}>{char.type}</Text>
                  </View>
                  <Text className="text-xs text-imperial-green font-bold mb-2">{char.description}</Text>
                  {artInfo && (
                    <View className={`border-t pt-2 ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                      <Text className={`mb-1 text-[10px] leading-normal ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        <Text className={`font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>Visual: </Text>
                        {artInfo.concept}
                      </Text>
                      <Text className={`text-[10px] leading-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        <Text className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>Inspiração: </Text>
                        {artInfo.inspiration}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View className="mb-8">
          <Text className={`mb-4 text-2xl font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>Ações do Jogo</Text>
          {Object.values(ACTIONS).map((action) => (
            <View key={action.type} className={`mb-4 rounded-xl border-l-4 p-4 shadow-sm ${
              isDark ? 'border-imperial-gold bg-white/5' : 'border-imperial-green bg-white'
            }`}>
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xl font-bold text-imperial-green">{action.name}</Text>
                {action.cost > 0 && (
                  <Text className={`rounded px-2 py-1 text-xs font-bold ${
                    isDark ? 'bg-imperial-gold/15 text-imperial-gold' : 'bg-amber-100 text-amber-800'
                  }`}>Custo: {action.cost}</Text>
                )}
              </View>
              <Text className={`mb-2 text-sm italic ${isDark ? 'text-stone-300' : 'text-text'}`}>
                {getActionDescription(action.type)}
              </Text>
              <View className="flex-row gap-2 mt-1">
                {action.isChallengeable && (
                  <Text className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded uppercase">Desafiável</Text>
                )}
                {action.isBlockable && (
                  <Text className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">Bloqueável</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View className="mb-12">
          <Text className={`text-center text-sm italic leading-normal ${isDark ? 'text-stone-500' : 'text-imperial-brown/60'}`}>
            Imperial — Projeto de Identidade e Cultura Brasileira.{"\n"}
            Desenvolvido para fins educacionais e de preservação de referências nacionais.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function getActionDescription(type: string): string {
  switch (type) {
    case 'COLETAR_IMPOSTOS_LOCAIS': return 'Recebe 1 moeda. Ação pública, não pode ser bloqueada ou desafiada.';
    case 'ARRECADACAO_PUBLICA': return 'Recebe 2 moedas. Qualquer adversário pode alegar Barão do Café para bloquear.';
    case 'GOLPE_DE_ESTADO': return 'Custa 7 moedas. Escolha um jogador para perder uma influência. Não pode ser bloqueado.';
    case 'RECEBER_IMPOSTO': return 'Requer Barão do Café. Recebe 3 moedas do tesouro.';
    case 'CONTRABANDO': return 'Requer Corsário. Rouba 2 moedas de outro jogador.';
    case 'CONSPIRACAO': return 'Custa 3 moedas ao ser declarada. Requer Capanga e pode ser bloqueada pela Marquesa do alvo.';
    case 'NEGOCIACAO': return 'Requer Diplomata. Escolha entre trocar 1 carta com o baralho ou ver 1 carta oculta de um adversário.';
    default: return '';
  }
}
