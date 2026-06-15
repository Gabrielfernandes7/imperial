import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Crown, Eye, ShieldAlert, Swords } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACTIONS, ActionType } from '../../game/models/ActionType';
import { CHARACTERS } from '../../game/models/Character';
import { GamePhase } from '../../game/models/GamePhase';
import { BlockClaims } from '../../game/rules/BlockClaims';
import { useNetworkSession } from '../../network/NetworkSessionStore';
import { StateSnapshot } from '../../network/sync/StateSnapshot';
import { ActionButton } from '../components/ActionButton';
import { CourtModal } from '../components/CourtModal';
import { CourtPromptModal } from '../components/CourtPromptModal';
import { GameEventList } from '../components/GameEventList';
import { InfluenceCard } from '../components/InfluenceCard';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { NightSky } from '../components/NightSky';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LanGame'>;
};

const ACTION_DETAILS: Record<ActionType, string> = {
  [ActionType.COLETAR_IMPOSTOS_LOCAIS]: 'Receba 1 moeda.',
  [ActionType.ARRECADACAO_PUBLICA]: 'Receba 2 moedas. Pode ser bloqueada.',
  [ActionType.GOLPE_DE_ESTADO]: 'Pague 7 moedas e remova uma influência.',
  [ActionType.RECEBER_IMPOSTO]: 'Alegue Barão do Café e receba 3 moedas.',
  [ActionType.CONSPIRACAO]: 'Alegue Capanga e remova uma influência.',
  [ActionType.CONTRABANDO]: 'Alegue Corsário e roube até 2 moedas.',
  [ActionType.NEGOCIACAO]: 'Alegue Diplomata para trocar 1 carta ou espiar adversário.',
};

export function LanGameScreen({ navigation }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const snapshot = useNetworkSession((state) => state.snapshot);
  const error = useNetworkSession((state) => state.error);
  const clearError = useNetworkSession((state) => state.clearError);
  const sendCommand = useNetworkSession((state) => state.sendCommand);
  const leave = useNetworkSession((state) => state.leave);
  const [exchangeIds, setExchangeIds] = useState<string[]>([]);
  const [visibleOwnInfluenceIds, setVisibleOwnInfluenceIds] = useState<string[]>([]);
  const [isSelectingSpyTarget, setIsSelectingSpyTarget] = useState(false);
  const [peekModalVisible, setPeekModalVisible] = useState(false);
  const [peekedTargetName, setPeekedTargetName] = useState('');
  const [lastPeekKey, setLastPeekKey] = useState('');
  const [promptState, setPromptState] = useState<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    buttons: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'destructive' }[];
  } | null>(null);

  useEffect(() => {
    if (error) {
      setPromptState({
        title: 'Comando rejeitado',
        subtitle: error,
        icon: <ShieldAlert color="#991B1B" size={20} />,
        buttons: [
          {
            label: 'OK',
            onPress: () => {
              setPromptState(null);
              clearError();
            },
          },
        ],
      });
    }
  }, [clearError, error]);

  useEffect(() => {
    if (snapshot?.phase !== GamePhase.SELECTING_CARDS_TO_EXCHANGE) {
      setExchangeIds([]);
    }
  }, [snapshot?.phase]);

  useEffect(() => {
    if (snapshot?.phase !== GamePhase.TURN_START) {
      setIsSelectingSpyTarget(false);
    }
  }, [snapshot?.phase]);

  useEffect(() => {
    const peek = snapshot?.privatePeekedInfluence;
    if (!peek) {
      return;
    }
    const key = `${peek.targetPlayerId}:${peek.influence.id}:${snapshot?.revision ?? 0}`;
    if (key === lastPeekKey) {
      return;
    }
    setLastPeekKey(key);
    setPeekedTargetName(
      snapshot?.players.find((player) => player.id === peek.targetPlayerId)?.name ?? 'Adversário',
    );
    setPeekModalVisible(true);
  }, [lastPeekKey, snapshot]);

  useEffect(() => {
    if (!snapshot || snapshot.phase !== GamePhase.GAME_OVER) {
      return;
    }
    const winner = snapshot.players.find((player) => player.id === snapshot.winnerId);
    navigation.replace('MatchResult', {
      winnerId: winner?.id ?? '',
      winnerName: winner?.name ?? 'Desconhecido',
      humanPlayerId: snapshot.recipientPlayerId,
      totalTurns: snapshot.turnNumber,
    });
  }, [navigation, snapshot]);

  if (!snapshot) {
    return null;
  }

  const selfId = snapshot.recipientPlayerId;
  const self = snapshot.self;
  const current = snapshot.players.find((player) => player.id === snapshot.currentPlayerId)!;
  const isSelfTurn = self.alive && snapshot.currentPlayerId === selfId;
  const response = responseState(snapshot);
  const isRevealing =
    snapshot.phase === GamePhase.SELECTING_CARD_TO_REVEAL &&
    snapshot.playerToRevealId === selfId;
  const isExchanging =
    snapshot.phase === GamePhase.SELECTING_CARDS_TO_EXCHANGE && isSelfTurn;

  const declareAction = (type: ActionType) => {
    if (type === ActionType.NEGOCIACAO) {
      setPromptState({
        title: 'Poder do Diplomata',
        subtitle: 'Escolha como quer usar a negociação.',
        icon: <Eye color={isDark ? '#C9A227' : '#1E5631'} size={20} />,
        buttons: [
          {
            label: 'Trocar 1 carta',
            onPress: () => {
              setPromptState(null);
              sendCommand({ type: 'DECLARE_ACTION', action: { type, actorId: selfId } });
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

    const needsTarget = [
      ActionType.GOLPE_DE_ESTADO,
      ActionType.CONSPIRACAO,
      ActionType.CONTRABANDO,
    ].includes(type);
    if (!needsTarget) {
      sendCommand({ type: 'DECLARE_ACTION', action: { type, actorId: selfId } });
      return;
    }

    const targets = snapshot.players.filter(
      (player) => player.alive && player.id !== selfId,
    );
    setPromptState({
      title: 'Escolha o alvo',
      subtitle: ACTIONS[type].name,
      icon: <Swords color={isDark ? '#C9A227' : '#A56E12'} size={20} />,
      buttons: targets.map((target) => ({
        label: target.name,
        onPress: () => {
          setPromptState(null);
          sendCommand({
            type: 'DECLARE_ACTION',
            action: { type, actorId: selfId, targetId: target.id },
          });
        },
      })),
    });
  };

  const toggleOwnInfluence = (influenceId: string) => {
    setVisibleOwnInfluenceIds((currentIds) =>
      currentIds.includes(influenceId)
        ? currentIds.filter((id) => id !== influenceId)
        : [...currentIds, influenceId],
    );
  };

  const selectOpponentInfluence = (playerId: string, influenceId: string) => {
    if (!isSelectingSpyTarget) {
      return;
    }
    setIsSelectingSpyTarget(false);
    sendCommand({
      type: 'DECLARE_ACTION',
      action: {
        type: ActionType.NEGOCIACAO,
        actorId: selfId,
        targetId: playerId,
        targetInfluenceId: influenceId,
      },
    });
  };

  const declareBlock = () => {
    const actionType = snapshot.pendingAction?.action.type;
    if (!actionType) {
      return;
    }
    setPromptState({
      title: 'Declarar bloqueio',
      subtitle: 'Qual influência você alega possuir?',
      icon: <ShieldAlert color="#991B1B" size={20} />,
      buttons: (BlockClaims[actionType] ?? []).map((characterType) => ({
        label: CHARACTERS[characterType].name,
        onPress: () => {
          setPromptState(null);
          sendCommand({ type: 'DECLARE_BLOCK', characterType });
        },
      })),
    });
  };

  const exit = () => {
    setPromptState({
      title: 'Sair da partida?',
      subtitle: 'A partida continuará pausada para os demais jogadores.',
      icon: <Crown color={isDark ? '#C9A227' : '#A56E12'} size={20} />,
      buttons: [
        { label: 'Cancelar', variant: 'secondary', onPress: () => setPromptState(null) },
        {
          label: 'Sair',
          variant: 'destructive',
          onPress: async () => {
            setPromptState(null);
            await leave();
            navigation.popToTop();
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-night-deep' : 'bg-imperial-cream'}`}>
      {isDark && <NightSky />}
      <View className={`flex-row items-center justify-between border-b px-4 py-3 ${
        isDark ? 'border-white/10 bg-night-mid/80' : 'border-imperial-gold/20 bg-white'
      }`}>
        <TouchableOpacity onPress={exit} className={`rounded-xl px-3 py-2 ${isDark ? 'border border-white/10 bg-white/5' : 'bg-stone-100'}`}>
          <Text className="font-bold text-red-800">Sair</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className={`text-[10px] font-bold uppercase tracking-[2px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Turno {snapshot.turnNumber}
          </Text>
          <Text className={`mt-1 font-bold ${isDark ? 'text-imperial-gold' : 'text-imperial-green'}`}>
            {phaseLabel(snapshot)}
          </Text>
        </View>
        <View className={`min-w-12 items-center rounded-xl px-3 py-2 ${
          isDark ? 'border border-imperial-gold/30 bg-imperial-gold/10' : 'bg-amber-50'
        }`}>
          <Text className={`font-black ${isDark ? 'text-imperial-gold' : 'text-amber-900'}`}>{self.coins}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className={`my-4 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-night-mid/80' : 'border-imperial-gold/25 bg-white'}`}>
          <View className="flex-row items-center justify-between">
            <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{self.name}</Text>
            <Text className={`text-xs font-bold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {self.alive ? 'Na disputa' : 'Eliminado'}
            </Text>
          </View>
          <View className="mt-3 flex-row">
            {self.influences.map((influence) => (
              <TouchableOpacity
                key={influence.id}
                disabled={influence.revealed}
                onPress={() => {
                  if (isRevealing) {
                    sendCommand({ type: 'REVEAL_INFLUENCE', influenceId: influence.id });
                  } else if (!influence.revealed) {
                    if (isExchanging) {
                      setExchangeIds((currentIds) =>
                        currentIds.includes(influence.id)
                          ? currentIds.filter((id) => id !== influence.id)
                          : currentIds.length < 1
                            ? [...currentIds, influence.id]
                            : currentIds,
                      );
                    } else {
                      toggleOwnInfluence(influence.id);
                    }
                  }
                }}
                className={`mr-2 flex-1 rounded-xl ${
                  exchangeIds.includes(influence.id)
                    ? isDark ? 'border-2 border-imperial-gold' : 'border-2 border-imperial-green'
                    : ''
                }`}
              >
                <InfluenceCard
                  influence={influence}
                  isOwner
                  forceFaceDown={
                    !isRevealing &&
                    !isExchanging &&
                    !influence.revealed &&
                    !visibleOwnInfluenceIds.includes(influence.id)
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text className={`mb-3 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          Corte
        </Text>
        {snapshot.players
          .filter((player) => player.id !== selfId)
          .map((player) => (
            <View
              key={player.id}
              className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
                player.id === current.id
                  ? isDark ? 'border-imperial-gold bg-imperial-gold/10' : 'border-imperial-green bg-white'
                  : isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/20 bg-white'
              }`}
            >
              <Crown color={player.alive ? (isDark ? '#C9A227' : '#A56E12') : '#A8A29E'} size={24} />
              <View className="ml-3 flex-1">
                <Text className={`font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{player.name}</Text>
                <Text className={`mt-1 text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {player.coins} moedas · {player.influenceCount} influências
                </Text>
                <View className="mt-3 flex-row">
                  {player.influences.map((influence) => (
                    <TouchableOpacity
                      key={influence.id}
                      disabled={!isSelectingSpyTarget || influence.revealed}
                      onPress={() => selectOpponentInfluence(player.id, influence.id)}
                      className="mr-2 w-20"
                    >
                      <InfluenceCard
                        influence={influence}
                        isOwner={false}
                        highlighted={isSelectingSpyTarget && !influence.revealed}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Text className={`text-xs font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {player.alive ? 'Vivo' : 'Eliminado'}
              </Text>
            </View>
          ))}

        <GameEventList events={snapshot.events} />
        <View className="h-6" />
      </ScrollView>

      <View className={`border-t px-4 pb-5 pt-4 ${isDark ? 'border-white/10 bg-night-mid' : 'border-imperial-gold/20 bg-white'}`}>
        {isRevealing ? (
          <Notice
            title="Escolha uma influência"
            description="Toque em uma de suas cartas ainda ocultas."
          />
        ) : isExchanging ? (
          <View>
            <Notice
              title={`Devolva uma carta (${exchangeIds.length}/1)`}
              description="Somente você recebeu a carta comprada."
            />
            <TouchableOpacity
              disabled={exchangeIds.length !== 1}
              onPress={() =>
                sendCommand({ type: 'EXCHANGE_CARDS', influenceIds: exchangeIds })
              }
              className={`mt-3 items-center rounded-2xl py-4 ${
                exchangeIds.length === 1
                  ? isDark ? 'bg-imperial-gold' : 'bg-imperial-green'
                  : isDark ? 'bg-white/10' : 'bg-stone-200'
              }`}
            >
              <Text className={`font-bold ${
                exchangeIds.length === 1
                  ? isDark ? 'text-night-deep' : 'text-white'
                  : isDark ? 'text-stone-500' : 'text-white'
              }`}>Confirmar troca</Text>
            </TouchableOpacity>
          </View>
        ) : response.canChallengeAction ? (
          <ResponseActions
            title={`${current.name} declarou ${pendingActionName(snapshot)}`}
            primary="Contestar"
            secondary="Aceitar ação"
            onPrimary={() => sendCommand({ type: 'CHALLENGE' })}
            onSecondary={() => sendCommand({ type: 'PASS_CHALLENGE' })}
          />
        ) : response.canBlock ? (
          <ResponseActions
            title={`${current.name} declarou ${pendingActionName(snapshot)}`}
            primary="Bloquear"
            secondary="Não bloquear"
            onPrimary={declareBlock}
            onSecondary={() => sendCommand({ type: 'PASS_BLOCK' })}
          />
        ) : response.canChallengeBlock ? (
          <ResponseActions
            title={`${blockerName(snapshot)} declarou um bloqueio`}
            primary="Contestar bloqueio"
            secondary="Aceitar bloqueio"
            onPrimary={() => sendCommand({ type: 'CHALLENGE_BLOCK' })}
            onSecondary={() => sendCommand({ type: 'PASS_BLOCK_CHALLENGE' })}
          />
        ) : isSelfTurn && snapshot.phase === GamePhase.TURN_START && isSelectingSpyTarget ? (
          <View>
            <Notice
              title="Escolha a carta do adversário"
              description="Toque em uma carta ainda oculta para espiar somente a carta escolhida."
            />
            <TouchableOpacity
              onPress={() => setIsSelectingSpyTarget(false)}
              className={`mt-3 items-center rounded-2xl py-4 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}
            >
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-stone-600'}`}>Cancelar espionagem</Text>
            </TouchableOpacity>
          </View>
        ) : isSelfTurn && snapshot.phase === GamePhase.TURN_START ? (
          <View className="flex-row flex-wrap justify-between">
            {Object.values(ActionType).map((type) => {
              const action = ACTIONS[type];
              const disabled =
                self.coins < action.cost ||
                (self.coins >= 10 && type !== ActionType.GOLPE_DE_ESTADO);
              return (
                <ActionButton
                  key={type}
                  label={action.name}
                  detail={ACTION_DETAILS[type]}
                  cost={action.cost}
                  disabled={disabled}
                  tone={
                    [ActionType.GOLPE_DE_ESTADO, ActionType.CONSPIRACAO].includes(type)
                      ? 'danger'
                      : action.characterRequired
                        ? 'gold'
                        : 'green'
                  }
                  onPress={() => declareAction(type)}
                />
              );
            })}
          </View>
        ) : isSelfTurn && snapshot.phase === GamePhase.ACTION_DECLARED ? (
          <TouchableOpacity
            onPress={() => sendCommand({ type: 'RESOLVE_ACTION' })}
            className={`flex-row items-center justify-center rounded-2xl py-4 ${isDark ? 'bg-imperial-gold' : 'bg-imperial-green'}`}
          >
            <Swords color={isDark ? '#0B1026' : '#F5F0E6'} size={20} />
            <Text className={`ml-2 font-bold ${isDark ? 'text-night-deep' : 'text-white'}`}>Executar ação</Text>
          </TouchableOpacity>
        ) : isSelfTurn && snapshot.phase === GamePhase.TURN_END ? (
          <TouchableOpacity
            onPress={() => sendCommand({ type: 'END_TURN' })}
            className={`items-center rounded-2xl py-4 ${isDark ? 'border border-white/20 bg-white/10' : 'bg-imperial-brown'}`}
          >
            <Text className="font-bold text-white">Encerrar turno</Text>
          </TouchableOpacity>
        ) : (
          <Notice
            title={self.alive ? 'Aguardando a corte' : 'Você foi eliminado'}
            description={
              self.alive
                ? `Vez de ${current.name} ou resposta de outro jogador.`
                : 'Acompanhe a partida até o fim.'
            }
          />
        )}
      </View>

      <CourtModal
        visible={peekModalVisible && Boolean(snapshot.privatePeekedInfluence)}
        title="Carta espiada"
        subtitle={
          peekedTargetName
            ? `${peekedTargetName} teve esta carta escolhida.`
            : 'Visualização privada da corte.'
        }
        icon={<Eye color={isDark ? '#C9A227' : '#1E5631'} size={20} />}
        onClose={() => setPeekModalVisible(false)}
      >
        {snapshot.privatePeekedInfluence && (
          <View className="mt-1 items-center">
            <View className={`w-52 rounded-[28px] border p-3 shadow-sm ${isDark ? 'border-white/10 bg-night-mid' : 'border-imperial-gold/25 bg-white'}`}>
              <InfluenceCard
                influence={snapshot.privatePeekedInfluence.influence}
                isOwner
              />
            </View>
            <Text className={`mt-4 text-center text-xs uppercase tracking-[3px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
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

function responseState(snapshot: StateSnapshot) {
  const selfId = snapshot.recipientPlayerId;
  const action = snapshot.pendingAction?.action;
  return {
    canChallengeAction:
      snapshot.self.alive &&
      snapshot.phase === GamePhase.CHALLENGE_WINDOW &&
      action?.actorId !== selfId &&
      !snapshot.challengePasses.includes(selfId),
    canBlock:
      snapshot.self.alive &&
      snapshot.phase === GamePhase.BLOCK_WINDOW &&
      Boolean(
        action &&
          !snapshot.blockPasses.includes(selfId) &&
          (action.type === ActionType.ARRECADACAO_PUBLICA
            ? action.actorId !== selfId
            : action.targetId === selfId),
      ),
    canChallengeBlock:
      snapshot.self.alive &&
      snapshot.phase === GamePhase.BLOCK_CHALLENGE_WINDOW &&
      snapshot.pendingBlock?.blockerId !== selfId &&
      !snapshot.blockChallengePasses.includes(selfId),
  };
}

function phaseLabel(snapshot: StateSnapshot) {
  if (snapshot.phase === GamePhase.TURN_START) {
    return snapshot.currentPlayerId === snapshot.recipientPlayerId
      ? 'Sua vez'
      : `Vez de ${snapshot.players.find((player) => player.id === snapshot.currentPlayerId)?.name}`;
  }
  const labels: Partial<Record<GamePhase, string>> = {
    [GamePhase.CHALLENGE_WINDOW]: 'Janela de contestação',
    [GamePhase.BLOCK_WINDOW]: 'Janela de bloqueio',
    [GamePhase.BLOCK_CHALLENGE_WINDOW]: 'Contestação ao bloqueio',
    [GamePhase.ACTION_DECLARED]: 'Ação confirmada',
    [GamePhase.SELECTING_CARD_TO_REVEAL]: 'Perda de influência',
    [GamePhase.SELECTING_CARDS_TO_EXCHANGE]: 'Negociação',
    [GamePhase.TURN_END]: 'Fim do turno',
  };
  return labels[snapshot.phase] ?? 'Imperial';
}

function pendingActionName(snapshot: StateSnapshot) {
  const type = snapshot.pendingAction?.action.type;
  return type ? ACTIONS[type].name : 'uma ação';
}

function blockerName(snapshot: StateSnapshot) {
  return (
    snapshot.players.find((player) => player.id === snapshot.pendingBlock?.blockerId)
      ?.name ?? 'Um jogador'
  );
}

function ResponseActions({
  title,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  title: string;
  primary: string;
  secondary: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <View>
      <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{title}</Text>
      <View className="mt-4 flex-row">
        <TouchableOpacity
          onPress={onPrimary}
          className="mr-2 flex-1 items-center rounded-2xl bg-red-700 py-4"
        >
          <Text className="font-bold text-white">{primary}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSecondary}
          className="ml-2 flex-1 items-center rounded-2xl bg-imperial-gold py-4"
        >
          <Text className={`font-bold ${isDark ? 'text-night-deep' : 'text-imperial-brown'}`}>{secondary}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Notice({ title, description }: { title: string; description: string }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <View className={`flex-row items-center rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/25 bg-amber-50'}`}>
      <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-white/10' : 'bg-white'}`}>
        {title.includes('influência') ? (
          <Eye color={isDark ? '#C9A227' : '#A56E12'} size={20} />
        ) : (
          <ShieldAlert color={isDark ? '#C9A227' : '#A56E12'} size={20} />
        )}
      </View>
      <View className="flex-1">
        <Text className={`font-bold ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{title}</Text>
        <Text className={`mt-1 text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{description}</Text>
      </View>
    </View>
  );
}
