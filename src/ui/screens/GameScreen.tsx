import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Eye, ShieldAlert, Swords } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../components/ActionButton';
import { CourtModal } from '../components/CourtModal';
import { CourtPromptModal } from '../components/CourtPromptModal';
import { GameEventList } from '../components/GameEventList';
import { InfluenceCard } from '../components/InfluenceCard';
import { PlayerCard } from '../components/PlayerCard';
import { useGameEngine } from '../hooks/useGameEngine';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ACTIONS, ActionType } from '../../game/models/ActionType';
import { CHARACTERS, CharacterType } from '../../game/models/Character';
import { GamePhase } from '../../game/models/GamePhase';
import { GameMode } from '../../game/models/GameMode';
import { MatchState } from '../../game/models/MatchState';
import { BlockClaims } from '../../game/rules/BlockClaims';

type GameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

const ACTION_DETAILS: Record<ActionType, string> = {
  [ActionType.COLETAR_IMPOSTOS_LOCAIS]: 'Receba 1 moeda sem alegar personagem.',
  [ActionType.ARRECADACAO_PUBLICA]: 'Receba 2 moedas. Pode ser bloqueada.',
  [ActionType.GOLPE_DE_ESTADO]: 'Remova uma influência. Não pode ser impedido.',
  [ActionType.RECEBER_IMPOSTO]: 'Alegue Barão do Café e receba 3 moedas.',
  [ActionType.CONSPIRACAO]: 'Alegue Capanga e remova uma influência.',
  [ActionType.CONTRABANDO]: 'Alegue Corsário e roube até 2 moedas.',
  [ActionType.NEGOCIACAO]: 'Alegue Diplomata para trocar 1 carta ou espiar adversário.',
};

export function GameScreen({ navigation, route }: GameScreenProps) {
  const { playerNames, mode } = route.params;
  const {
    state,
    initGame,
    declareAction,
    challenge,
    passChallenge,
    declareBlock,
    challengeBlock,
    passBlock,
    passBlockChallenge,
    resolveAction,
    revealInfluence,
    exchangeCards,
    endTurn,
    step,
  } = useGameEngine(playerNames, mode);
  const [selectedExchangeIds, setSelectedExchangeIds] = useState<string[]>([]);
  const [visibleOwnInfluenceIds, setVisibleOwnInfluenceIds] = useState<string[]>([]);
  const [isSelectingSpyTarget, setIsSelectingSpyTarget] = useState(false);
  const [peekModalVisible, setPeekModalVisible] = useState(false);
  const [peekedPlayerName, setPeekedPlayerName] = useState<string>('');
  const [lastPeekKey, setLastPeekKey] = useState('');
  const [promptState, setPromptState] = useState<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    buttons: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'destructive' }[];
  } | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleResolveAction = () => {
    // Capture necessary data before resolution as state might change
    const targetId = state?.pendingAction?.action.targetId;
    const targetName = state?.players.find((p) => p.id === targetId)?.name ?? 'Adversário';

    const res = resolveAction();

    if (res?.peekedInfluence) {
      setPeekedPlayerName(targetName);
      setPeekModalVisible(true);
    }
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (state?.phase !== GamePhase.SELECTING_CARDS_TO_EXCHANGE) {
      setSelectedExchangeIds([]);
    }
  }, [state?.phase]);

  useEffect(() => {
    if (state?.phase !== GamePhase.TURN_START) {
      setIsSelectingSpyTarget(false);
    }
  }, [state?.phase]);

  useEffect(() => {
    const peek = state?.privatePeekedInfluence;
    if (!peek || !state) {
      return;
    }

    const key = `${state.turnNumber}:${peek.targetPlayerId}:${peek.influence.id}`;
    if (key === lastPeekKey) {
      return;
    }

    setLastPeekKey(key);
    setPeekedPlayerName(
      state.players.find((player) => player.id === peek.targetPlayerId)?.name ?? 'Adversário',
    );
    setPeekModalVisible(true);
  }, [lastPeekKey, state]);

  useEffect(() => {
    if (!state || state.phase !== GamePhase.GAME_OVER) {
      return;
    }

    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }
    const winner = state.players.find((player) => player.id === state.winnerId);
    navigation.replace('MatchResult', {
      winnerId: winner?.id ?? '',
      winnerName: winner?.name ?? 'Desconhecido',
      humanPlayerId: state.players[0].id,
      totalTurns: state.turnNumber,
    });
  }, [navigation, state]);

  useEffect(() => {
    if (!state || state.phase === GamePhase.GAME_OVER) {
      return;
    }

    const human = state.players[0];
    const response = getResponseState(state, human.id);
    const humanTurnWork =
      human.alive &&
      state.currentPlayerIndex === 0 &&
      [GamePhase.TURN_START, GamePhase.ACTION_DECLARED, GamePhase.TURN_END].includes(
        state.phase,
      );
    const humanCardWork =
      (state.phase === GamePhase.SELECTING_CARD_TO_REVEAL &&
        state.playerToRevealId === human.id) ||
      (state.phase === GamePhase.SELECTING_CARDS_TO_EXCHANGE &&
        state.currentPlayerIndex === 0);
    const waitingForHuman =
      humanCardWork || humanTurnWork || (response.humanCanRespond && !response.botCanRespond);

    if (!waitingForHuman) {
      const stepDelay =
        state.config.mode === GameMode.INICIANTE
          ? 1200
          : state.config.mode === GameMode.AVANCADO
            ? 650
            : 850;
      botTimerRef.current = setTimeout(step, stepDelay);
      return () => {
        if (botTimerRef.current) {
          clearTimeout(botTimerRef.current);
        }
      };
    }
  }, [state, step]);

  if (!state) {
    return null;
  }

  const human = state.players[0];
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = human.alive && currentPlayer.id === human.id;
  const isHumanRevealing =
    state.phase === GamePhase.SELECTING_CARD_TO_REVEAL &&
    state.playerToRevealId === human.id;
  const isHumanExchanging =
    state.phase === GamePhase.SELECTING_CARDS_TO_EXCHANGE && isHumanTurn;
  const response = getResponseState(state, human.id);
  const canRespondNow = response.humanCanRespond && !response.botCanRespond;

  const handleAction = (type: ActionType) => {
    if (!isHumanTurn || state.phase !== GamePhase.TURN_START) {
      return;
    }

    if (type === ActionType.NEGOCIACAO) {
      setPromptState({
        title: 'Poder do Diplomata',
        subtitle: 'Escolha como quer usar a negociação.',
        icon: <Eye color="#1E5631" size={20} />,
        buttons: [
          {
            label: 'Trocar 1 carta',
            onPress: () => {
              setPromptState(null);
              declareAction({ type, actorId: human.id });
            },
          },
          {
            label: 'Espiar 1 carta',
            onPress: () => {
              setPromptState(null);
              setIsSelectingSpyTarget(true);
            },
          },
          {
            label: 'Cancelar',
            variant: 'secondary',
            onPress: () => setPromptState(null),
          },
        ],
      });
      return;
    }

    if (
      [ActionType.GOLPE_DE_ESTADO, ActionType.CONSPIRACAO, ActionType.CONTRABANDO].includes(
        type,
      )
    ) {
      const targets = state.players.filter(
        (player) => player.alive && player.id !== human.id,
      );
      setPromptState({
        title: 'Escolha o alvo',
        subtitle: ACTIONS[type].name,
        icon: <Swords color="#A56E12" size={20} />,
        buttons: targets.map((target) => ({
          label: target.name,
          onPress: () => {
            setPromptState(null);
            declareAction({ type, actorId: human.id, targetId: target.id });
          },
        })),
      });
      return;
    }

    declareAction({ type, actorId: human.id });
  };

  const handleInfluencePress = (influenceId: string) => {
    if (isHumanRevealing) {
      revealInfluence(human.id, influenceId);
      return;
    }
    if (isHumanExchanging) {
      setSelectedExchangeIds((current) =>
        current.includes(influenceId)
          ? current.filter((id) => id !== influenceId)
          : current.length < 1
            ? [...current, influenceId]
            : current,
      );
    }
  };

  const toggleOwnInfluence = (influenceId: string) => {
    setVisibleOwnInfluenceIds((current) =>
      current.includes(influenceId)
        ? current.filter((id) => id !== influenceId)
        : [...current, influenceId],
    );
  };

  const handleOpponentInfluencePress = (playerId: string, influenceId: string) => {
    if (!isSelectingSpyTarget) {
      return;
    }
    setIsSelectingSpyTarget(false);
    declareAction({
      type: ActionType.NEGOCIACAO,
      actorId: human.id,
      targetId: playerId,
      targetInfluenceId: influenceId,
    });
  };

  const showBlockOptions = () => {
    const actionType = state.pendingAction?.action.type;
    if (!actionType) return;
    const options = BlockClaims[actionType] ?? [];
    setPromptState({
      title: 'Declarar bloqueio',
      subtitle: 'Qual influência você alega possuir?',
      icon: <ShieldAlert color="#991B1B" size={20} />,
      buttons: options.map((character) => ({
        label: CHARACTERS[character].name,
        onPress: () => {
          setPromptState(null);
          declareBlock(human.id, character);
        },
      })),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-imperial-cream" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-imperial-gold/20 bg-white/90 px-4 py-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-xl bg-stone-100"
        >
          <ChevronLeft color="#5E412F" size={24} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[10px] font-bold uppercase tracking-[2px] text-stone-400">
            Turno {state.turnNumber}
          </Text>
          <Text className="mt-1 font-bold text-imperial-green">
            {phaseLabel(state, human.id)}
          </Text>
        </View>
        <View className="h-10 min-w-10 items-center justify-center rounded-xl border border-imperial-gold/20 bg-amber-50 px-2">
          <Text className="text-xs font-black text-amber-900">{human.coins}</Text>
        </View>
      </View>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <View className="mb-2 mt-3">
          <PlayerCard
            player={human}
            isCurrent={isHumanTurn}
            isUser
            selectionMode={
              isHumanRevealing ? 'reveal' : isHumanExchanging ? 'exchange' : undefined
            }
            selectedCardIds={selectedExchangeIds}
            onSelectCard={handleInfluencePress}
            visibleInfluenceIds={visibleOwnInfluenceIds}
            onTogglePrivateView={toggleOwnInfluence}
          />
        </View>

        <View className="mb-2 flex-row items-center">
          <View className="h-px flex-1 bg-imperial-gold/20" />
          <Text className="mx-3 text-[10px] font-bold uppercase tracking-[2px] text-stone-400">
            Corte
          </Text>
          <View className="h-px flex-1 bg-imperial-gold/20" />
        </View>

        {state.players.slice(1).map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrent={currentPlayer.id === player.id}
            isUser={false}
            selectionMode={isSelectingSpyTarget ? 'spy' : undefined}
            onSelectCard={(influenceId) =>
              handleOpponentInfluencePress(player.id, influenceId)
            }
          />
        ))}

        <GameEventList events={state.events} />
        <View className="h-6" />
      </ScrollView>

      <View className="border-t border-imperial-gold/20 bg-white px-4 pb-5 pt-4">
        {isHumanRevealing ? (
          <ResponseNotice
            icon="eye"
            title="Escolha uma influência"
            description="Toque em uma de suas cartas ainda ocultas para revelá-la."
          />
        ) : isHumanExchanging ? (
          <View>
            <ResponseNotice
              icon="eye"
              title={`Devolva 1 carta (${selectedExchangeIds.length}/1)`}
              description="Escolha entre suas influências e a carta comprada do baralho."
            />
            <TouchableOpacity
              disabled={selectedExchangeIds.length !== 1}
              onPress={() => exchangeCards(human.id, selectedExchangeIds)}
              className={`mt-3 items-center rounded-2xl py-4 ${
                selectedExchangeIds.length === 1 ? 'bg-imperial-green' : 'bg-stone-200'
              }`}
            >
              <Text
                className={`font-bold ${
                  selectedExchangeIds.length === 1 ? 'text-white' : 'text-stone-400'
                }`}
              >
                Confirmar troca
              </Text>
            </TouchableOpacity>
          </View>
        ) : canRespondNow && state.phase === GamePhase.CHALLENGE_WINDOW ? (
          <ResponseActions
            title={`${currentPlayer.name} alega ${claimName(state)}`}
            description="Desafie se acreditar que a alegação é um blefe."
            primaryLabel="Desafiar"
            secondaryLabel="Aceitar ação"
            onPrimary={() => challenge(human.id)}
            onSecondary={() => passChallenge(human.id)}
          />
        ) : canRespondNow && state.phase === GamePhase.BLOCK_WINDOW ? (
          <ResponseActions
            title={`${currentPlayer.name} declarou ${pendingActionName(state)}`}
            description="Você pode alegar uma influência capaz de bloquear esta ação."
            primaryLabel="Bloquear"
            secondaryLabel="Não bloquear"
            onPrimary={showBlockOptions}
            onSecondary={() => passBlock(human.id)}
          />
        ) : canRespondNow && state.phase === GamePhase.BLOCK_CHALLENGE_WINDOW ? (
          <ResponseActions
            title={`${blockerName(state)} declarou um bloqueio`}
            description={`Alegação: ${blockClaimName(state)}.`}
            primaryLabel="Desafiar bloqueio"
            secondaryLabel="Aceitar bloqueio"
            onPrimary={() => challengeBlock(human.id)}
            onSecondary={() => passBlockChallenge(human.id)}
          />
        ) : isHumanTurn && state.phase === GamePhase.TURN_START && isSelectingSpyTarget ? (
          <View>
            <ResponseNotice
              icon="eye"
              title="Escolha a carta do adversário"
              description="Toque em uma carta ainda oculta para espiar somente aquela carta."
            />
            <TouchableOpacity
              onPress={() => setIsSelectingSpyTarget(false)}
              className="mt-3 items-center rounded-2xl bg-stone-200 py-4"
            >
              <Text className="font-bold text-stone-600">Cancelar espionagem</Text>
            </TouchableOpacity>
          </View>
        ) : isHumanTurn && state.phase === GamePhase.TURN_START ? (
          <View>
            {state.config.mode === GameMode.INICIANTE && (
              <View className="mb-3 rounded-2xl border border-imperial-gold/20 bg-amber-50 p-4">
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-imperial-green">
                  Conselho da Corte
                </Text>
                <Text className="mt-1 text-sm leading-5 text-stone-600">
                  {getBeginnerAdvice(state, human.id)}
                </Text>
              </View>
            )}
            <Text className="mb-3 text-xs font-bold uppercase tracking-[2px] text-stone-400">
              Escolha sua ação
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {Object.values(ActionType).map((type) => {
                const action = ACTIONS[type];
                const disabled =
                  human.coins < action.cost ||
                  (human.coins >= 10 && type !== ActionType.GOLPE_DE_ESTADO);
                return (
                  <ActionButton
                    key={type}
                    label={action.name}
                    detail={ACTION_DETAILS[type]}
                    cost={action.cost}
                    disabled={disabled}
                    tone={
                      type === ActionType.GOLPE_DE_ESTADO ||
                      type === ActionType.CONSPIRACAO
                        ? 'danger'
                        : action.characterRequired
                          ? 'gold'
                          : 'green'
                    }
                    onPress={() => handleAction(type)}
                  />
                );
              })}
            </View>
          </View>
        ) : isHumanTurn && state.phase === GamePhase.ACTION_DECLARED ? (
          <TouchableOpacity
            onPress={handleResolveAction}
            className="flex-row items-center justify-center rounded-2xl bg-imperial-green py-4"
          >
            <Swords color="#F5F0E6" size={20} />
            <Text className="ml-2 font-bold text-imperial-cream">Executar ação</Text>
          </TouchableOpacity>
        ) : isHumanTurn && state.phase === GamePhase.TURN_END ? (
          <TouchableOpacity
            onPress={endTurn}
            className="items-center rounded-2xl bg-imperial-brown py-4"
          >
            <Text className="font-bold text-white">Encerrar turno</Text>
          </TouchableOpacity>
        ) : !human.alive ? (
          <ResponseNotice
            icon="shield"
            title="Você foi eliminado"
            description="Acompanhe a disputa até que reste apenas uma influência na corte."
          />
        ) : (
          <ResponseNotice
            icon="shield"
            title="A corte está deliberando"
            description={`Aguardando ${currentPlayer.name} e os demais jogadores responderem.`}
          />
        )}
      </View>

      <CourtModal
        visible={peekModalVisible && Boolean(state.privatePeekedInfluence)}
        title="Carta espiada"
        subtitle={
          peekedPlayerName
            ? `${peekedPlayerName} teve esta carta escolhida.`
            : 'Visualização privada da corte.'
        }
        icon={<Eye color="#1E5631" size={20} />}
        onClose={() => setPeekModalVisible(false)}
      >
        {state.privatePeekedInfluence?.influence && (
          <View className="mt-1 items-center">
            <View className="w-52 rounded-[28px] border border-imperial-gold/25 bg-white p-3 shadow-sm">
              <InfluenceCard
                influence={state.privatePeekedInfluence.influence}
                isOwner
              />
            </View>
            <Text className="mt-4 text-center text-xs uppercase tracking-[3px] text-stone-400">
              Informação reservada
            </Text>
          </View>
        )}
      </CourtModal>

      <CourtPromptModal
        visible={Boolean(promptState)}
      title={promptState?.title ?? ''}
      subtitle={promptState?.subtitle}
      onClose={() => setPromptState(null)}
        icon={promptState?.icon}
      buttons={promptState?.buttons ?? []}
      />
    </SafeAreaView>
  );
}

function getResponseState(state: MatchState, humanId: string) {
  let eligibleIds: string[] = [];
  let passedIds: string[] = [];

  if (state.phase === GamePhase.CHALLENGE_WINDOW && state.pendingAction) {
    eligibleIds = state.players
      .filter((player) => player.alive && player.id !== state.pendingAction!.action.actorId)
      .map((player) => player.id);
    passedIds = state.challengePasses;
  } else if (state.phase === GamePhase.BLOCK_WINDOW && state.pendingAction) {
    const action = state.pendingAction.action;
    eligibleIds =
      action.type === ActionType.ARRECADACAO_PUBLICA
        ? state.players
            .filter((player) => player.alive && player.id !== action.actorId)
            .map((player) => player.id)
        : action.targetId
          ? [action.targetId]
          : [];
    passedIds = state.blockPasses;
  } else if (state.phase === GamePhase.BLOCK_CHALLENGE_WINDOW && state.pendingBlock) {
    eligibleIds = state.players
      .filter((player) => player.alive && player.id !== state.pendingBlock!.blockerId)
      .map((player) => player.id);
    passedIds = state.blockChallengePasses;
  }

  const pendingIds = eligibleIds.filter((id) => !passedIds.includes(id));
  return {
    humanCanRespond: pendingIds.includes(humanId),
    botCanRespond: pendingIds.some(
      (id) => state.players.find((player) => player.id === id)?.isBot,
    ),
  };
}

function phaseLabel(state: MatchState, humanId: string) {
  if (state.phase === GamePhase.TURN_START) {
    return state.players[state.currentPlayerIndex].id === humanId
      ? 'Sua vez'
      : `Vez de ${state.players[state.currentPlayerIndex].name}`;
  }
  const labels: Partial<Record<GamePhase, string>> = {
    [GamePhase.CHALLENGE_WINDOW]: 'Janela de desafio',
    [GamePhase.BLOCK_WINDOW]: 'Janela de bloqueio',
    [GamePhase.BLOCK_CHALLENGE_WINDOW]: 'Desafio ao bloqueio',
    [GamePhase.ACTION_DECLARED]: 'Ação confirmada',
    [GamePhase.ACTION_RESOLUTION]: 'Resolvendo ação',
    [GamePhase.SELECTING_CARD_TO_REVEAL]: 'Perda de influência',
    [GamePhase.SELECTING_CARDS_TO_EXCHANGE]: 'Negociação',
    [GamePhase.TURN_END]: 'Fim do turno',
  };
  return labels[state.phase] ?? 'Imperial';
}

function claimName(state: MatchState) {
  const character = state.pendingAction?.requiredCharacter;
  return character ? CHARACTERS[character].name : 'uma influência';
}

function pendingActionName(state: MatchState) {
  const type = state.pendingAction?.action.type;
  return type ? ACTIONS[type].name : 'uma ação';
}

function blockerName(state: MatchState) {
  const id = state.pendingBlock?.blockerId;
  return state.players.find((player) => player.id === id)?.name ?? 'Um jogador';
}

function blockClaimName(state: MatchState) {
  const character = state.pendingBlock?.requiredCharacter;
  return character ? CHARACTERS[character].name : 'influência desconhecida';
}

function getBeginnerAdvice(state: MatchState, humanId: string) {
  const human = state.players.find((player) => player.id === humanId);
  if (!human) {
    return 'Comece por ações simples enquanto observa quais alegações a corte costuma respeitar.';
  }

  if (human.coins >= 7) {
    return 'Você já ameaça um Golpe de Estado. Use essa pressão para forçar os rivais a reagirem com cuidado.';
  }

  const activeTypes = human.influences
    .filter((influence) => !influence.revealed)
    .map((influence) => influence.character.type);

  if (activeTypes.includes(CharacterType.DUQUE)) {
    return 'Seu Barão do Café pode acelerar sua economia. Receber Imposto é uma jogada forte quando a mesa ainda está calma.';
  }

  if (activeTypes.includes(CharacterType.CAPITAO)) {
    return 'Você pode pressionar os bolsos dos rivais com Contrabando. Mire em quem já acumulou moedas.';
  }

  if (activeTypes.includes(CharacterType.EMBAIXADOR)) {
    return 'Negociação ajuda a reduzir risco e também a espionar a corte. É uma boa ação quando você quer mais informação.';
  }

  return 'Coletar moedas e observar bloqueios ainda é a forma mais segura de entender a mesa nesta rodada.';
}

function ResponseActions({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <View>
      <Text className="text-lg font-black text-imperial-brown">{title}</Text>
      <Text className="mt-1 text-sm leading-5 text-stone-500">{description}</Text>
      <View className="mt-4 flex-row">
        <TouchableOpacity
          onPress={onPrimary}
          className="mr-2 flex-1 items-center rounded-2xl bg-red-700 py-4"
        >
          <Text className="font-bold text-white">{primaryLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSecondary}
          className="ml-2 flex-1 items-center rounded-2xl bg-imperial-gold py-4"
        >
          <Text className="font-bold text-imperial-brown">{secondaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ResponseNotice({
  icon,
  title,
  description,
}: {
  icon: 'eye' | 'shield';
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-imperial-gold/25 bg-amber-50 p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-white">
        {icon === 'eye' ? (
          <Eye color="#A56E12" size={20} />
        ) : (
          <ShieldAlert color="#A56E12" size={20} />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-imperial-brown">{title}</Text>
        <Text className="mt-1 text-xs leading-4 text-stone-500">{description}</Text>
      </View>
    </View>
  );
}
