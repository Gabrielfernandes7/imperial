import { GameEngine } from '../../game/engine/GameEngine';
import { ActionType } from '../../game/models/ActionType';
import { GamePhase } from '../../game/models/GamePhase';
import { MatchAuthority } from '../host/MatchAuthority';
import { JsonLineDecoder, encodeMessage } from '../protocol/JsonLineCodec';
import { ClientMessage, GameCommand } from '../protocol/ClientMessages';
import { ClientMessageType, envelope } from '../protocol/MessageTypes';
import { subnetPrefix } from '../utils/ip';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function expectThrows(callback: () => void, expectedMessage: string): void {
  try {
    callback();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(message.includes(expectedMessage), `Expected "${expectedMessage}", got "${message}"`);
    return;
  }
  throw new Error(`Assertion Failed: expected error containing "${expectedMessage}"`);
}

function execute(
  authority: MatchAuthority,
  playerId: string,
  command: GameCommand,
): void {
  const result = authority.execute(playerId, command);
  assert(result.success, result.message);
}

console.log('--- Running LAN Multiplayer Validation ---');

const decoder = new JsonLineDecoder<ClientMessage>();
const discover = envelope(ClientMessageType.DISCOVER, {});
const encoded = encodeMessage(discover);
assert(decoder.push(encoded.slice(0, 7)).length === 0, 'Partial frames must be buffered');
const decoded = decoder.push(encoded.slice(7));
assert(decoded.length === 1, 'A complete frame must be decoded');
assert(decoded[0].type === ClientMessageType.DISCOVER, 'Frame type must be preserved');
assert(subnetPrefix('192.168.15.44') === '192.168.15', 'IPv4 subnet must be derived');
assert(subnetPrefix('invalid') === undefined, 'Invalid IPv4 must be rejected');

const authority = new MatchAuthority(
  'Mesa de Teste',
  'Host',
  'client-host',
  '192.168.15.44',
  45892,
);
const host = authority.join('client-host', 'Host');
const guest = authority.join('client-guest', 'Convidado');
const observer = authority.join('client-observer', 'Observador');
authority.setReady(guest.id, true);
authority.setReady(observer.id, true);

expectThrows(() => authority.startMatch(guest.id), 'Somente o Host');
authority.startMatch(host.id);

const hostInitial = authority.getSnapshot(host.id);
const guestInitial = authority.getSnapshot(guest.id);
assert(hostInitial.self.influences.length === 2, 'Host must receive its own cards');
assert(guestInitial.self.influences.length === 2, 'Guest must receive its own cards');
assert(!hostInitial.players.some((player) => player.botPersonality), 'LAN players must not expose bot personalities');
assert(!('deck' in hostInitial), 'Snapshot must never expose the deck');

const guestPublicFromHost = hostInitial.players.find((player) => player.id === guest.id);
assert(guestPublicFromHost, 'Host snapshot must include the guest public state');
guestPublicFromHost.influences.forEach((influence) => {
  if (!influence.revealed) {
    assert(
      !influence.character,
      'A client snapshot must not contain another player hidden influence character',
    );
  }
});

expectThrows(
  () =>
    authority.execute(guest.id, {
      type: 'DECLARE_ACTION',
      action: { actorId: host.id, type: ActionType.COLETAR_IMPOSTOS_LOCAIS },
    }),
  'agir por outro jogador',
);

execute(authority, host.id, {
  type: 'DECLARE_ACTION',
  action: { actorId: host.id, type: ActionType.RECEBER_IMPOSTO },
});
execute(authority, guest.id, { type: 'CHALLENGE' });
const challengedHostView = authority.getSnapshot(host.id);
const loserId = challengedHostView.playerToRevealId;
assert(loserId, 'A challenge must select a player to lose influence');
const loserView = authority.getSnapshot(loserId);
const influenceToReveal = loserView.self.influences.find((influence) => !influence.revealed);
assert(influenceToReveal, 'Challenge loser must have an influence to reveal');
execute(authority, loserId, {
  type: 'REVEAL_INFLUENCE',
  influenceId: influenceToReveal.id,
});

const revisions = [
  authority.getSnapshot(host.id).revision,
  authority.getSnapshot(guest.id).revision,
  authority.getSnapshot(observer.id).revision,
];
assert(new Set(revisions).size === 1, 'All clients must observe the same revision');

const eliminatedEngine = new GameEngine(['Ator', 'Eliminado', 'Vivo'], 0, {
  allHuman: true,
});
eliminatedEngine.startGame();
const [actor, eliminated] = eliminatedEngine.debugState().players;
eliminated.alive = false;
eliminated.influences.forEach((influence) => {
  influence.revealed = true;
});
eliminatedEngine.declareAction({
  actorId: actor.id,
  type: ActionType.RECEBER_IMPOSTO,
});
assert(
  !eliminatedEngine.challenge(eliminated.id).success,
  'Eliminated players must not be able to challenge',
);

const fullMatch = new MatchAuthority(
  'Partida Completa',
  'Ana',
  'client-ana',
  '192.168.15.44',
  45892,
);
const ana = fullMatch.join('client-ana', 'Ana');
const bia = fullMatch.join('client-bia', 'Bia');
fullMatch.setReady(bia.id, true);
fullMatch.startMatch(ana.id);

let safety = 0;
while (fullMatch.getPhase() !== GamePhase.GAME_OVER && safety < 100) {
  const anaView = fullMatch.getSnapshot(ana.id);
  const currentId = anaView.currentPlayerId;
  const currentView = fullMatch.getSnapshot(currentId);
  const opponent = anaView.players.find((player) => player.id !== currentId && player.alive);
  assert(opponent, 'An active player must have an opponent');

  if (currentView.self.coins >= 7) {
    execute(fullMatch, currentId, {
      type: 'DECLARE_ACTION',
      action: {
        actorId: currentId,
        targetId: opponent.id,
        type: ActionType.GOLPE_DE_ESTADO,
      },
    });
    execute(fullMatch, currentId, { type: 'RESOLVE_ACTION' });
    const targetView = fullMatch.getSnapshot(opponent.id);
    const targetInfluence = targetView.self.influences.find(
      (influence) => !influence.revealed,
    );
    assert(targetInfluence, 'Coup target must have an influence to reveal');
    execute(fullMatch, opponent.id, {
      type: 'REVEAL_INFLUENCE',
      influenceId: targetInfluence.id,
    });
  } else {
    execute(fullMatch, currentId, {
      type: 'DECLARE_ACTION',
      action: {
        actorId: currentId,
        type: ActionType.COLETAR_IMPOSTOS_LOCAIS,
      },
    });
    execute(fullMatch, currentId, { type: 'RESOLVE_ACTION' });
  }

  if (fullMatch.getPhase() === GamePhase.TURN_END) {
    execute(fullMatch, currentId, { type: 'END_TURN' });
  }
  safety++;
}

assert(fullMatch.getPhase() === GamePhase.GAME_OVER, 'A full LAN match must finish');
const finalState = fullMatch.getSnapshot(ana.id);
assert(Boolean(finalState.winnerId), 'A completed match must have a winner');

const disconnectMatch = new MatchAuthority(
  'Desconexão',
  'Host',
  'disconnect-host',
  '192.168.15.44',
  45892,
);
const disconnectHost = disconnectMatch.join('disconnect-host', 'Host');
const disconnectGuest = disconnectMatch.join('disconnect-guest', 'Guest');
disconnectMatch.setReady(disconnectGuest.id, true);
disconnectMatch.startMatch(disconnectHost.id);
disconnectMatch.disconnect(disconnectGuest.id);
assert(
  !disconnectMatch.getLobbyState().players.find((player) => player.id === disconnectGuest.id)
    ?.connected,
  'Disconnected players must remain marked offline during a match',
);
expectThrows(
  () => disconnectMatch.execute(disconnectGuest.id, { type: 'PASS_CHALLENGE' }),
  'desconectado',
);
const reconnected = disconnectMatch.join('disconnect-guest', 'Guest');
assert(reconnected.id === disconnectGuest.id, 'A client id must reclaim the same player');
assert(reconnected.connected, 'Rejoined player must be marked connected');

console.log('--- LAN Multiplayer Validation Successful ---');
