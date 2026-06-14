# Multiplayer LAN

## Escopo

O multiplayer usa uma topologia Host-Client sem login, backend ou servidor externo.
Um dispositivo abre um servidor TCP na rede Wi-Fi e permanece como autoridade
durante toda a partida.

Esta implementação exige um **development build**. O Expo Go não carrega o módulo
nativo `react-native-tcp-socket`. O projeto segue o Expo SDK 54:

- https://docs.expo.dev/versions/v54.0.0/
- https://docs.expo.dev/versions/v54.0.0/sdk/network/
- https://docs.expo.dev/versions/v54.0.0/develop/development-builds/introduction/

## Arquitetura

```text
Cliente
  GameClient
      |
      | TCP + JSON Lines
      v
HostServer -> ClientManager -> MatchAuthority -> GameEngine
                                      |
                                      v
                         StateSerializer por jogador
                                      |
                                      v
                         snapshot privado para cada cliente
```

Responsabilidades:

- `HostServer`: aceita conexões TCP, valida o protocolo e distribui mensagens.
- `ClientManager`: associa sockets a jogadores e faz framing JSON Lines.
- `MatchAuthority`: é o único componente de rede autorizado a chamar `GameEngine`.
- `GameClient`: envia intenções e recebe lobby/snapshots.
- `DiscoveryClient`: encontra Hosts automaticamente por varredura paralela da
  sub-rede IPv4 local na porta `45892`.
- `StateSerializer`: remove baralho, cartas adversárias e campos internos antes
  de gerar um snapshot.
- `NetworkSessionStore`: mantém a sessão entre as telas React Native.

## Protocolo

Cada frame é um objeto JSON terminado por `\n` e contém `version`, `type`,
`requestId` opcional e `payload`. O decoder aceita frames fragmentados e rejeita
mensagens acima de 1 MiB.

Mensagens do cliente:

- `DISCOVER`
- `JOIN`
- `SET_READY`
- `START_MATCH`
- `GAME_COMMAND`
- `LEAVE`
- `PING`

Mensagens do Host:

- `TABLE_INFO`
- `WELCOME`
- `LOBBY_STATE`
- `STATE_SNAPSHOT`
- `COMMAND_REJECTED`
- `PLAYER_DISCONNECTED`
- `ERROR`
- `PONG`

Comandos de jogo são intenções tipadas. O Host substitui a identidade implícita
pelo jogador associado ao socket e rejeita tentativas de agir por outro jogador.

## Fluxo

1. O Host obtém o IP Wi-Fi com `expo-network`.
2. `HostServer` escuta em `0.0.0.0:45892`.
3. O próprio Host entra via `GameClient` usando loopback, seguindo o mesmo
   protocolo dos demais participantes.
4. Clientes consultam endereços da sub-rede local em lotes e exibem respostas
   `TABLE_INFO`.
5. No lobby, todos os clientes marcam `ready`; somente o Host envia
   `START_MATCH`.
6. `MatchAuthority` cria um único `GameEngine`, preservando os IDs do lobby e
   marcando todos como humanos.
7. Cada comando válido incrementa a revisão e produz um snapshot específico para
   cada jogador conectado.

## Privacidade

O `MatchState` completo nunca é enviado.

Cada snapshot contém:

- as próprias cartas completas;
- moedas, status e quantidade de influências dos adversários;
- ação, bloqueio, fase e eventos públicos;
- IDs necessários para responder ao fluxo atual.

Cada snapshot exclui:

- baralho;
- personagens das cartas privadas dos adversários;
- cartas privadas completas dos adversários, exceto metadados mínimos para seleção de alvo na UI;
- cartas temporárias de negociação dos adversários;
- campos internos não necessários ao cliente.

O TCP local não fornece criptografia nem autenticação forte. O modelo de ameaça
desta sprint considera uma rede doméstica confiável. Para redes hostis, o próximo
passo seria TLS com pareamento por código da mesa.

## Desconexão e reconexão

- Antes do início, um cliente desconectado é removido do lobby.
- Durante a partida, o jogador permanece na mesa como `connected: false`.
- Comandos de jogadores desconectados são rejeitados.
- Ao reconectar com o mesmo `clientId` aleatório, o jogador recupera o mesmo
  `playerId`, a conexão anterior é encerrada e o snapshot atual é enviado.
- Não há migração de Host. Se o Host encerrar o aplicativo, a partida termina.
- A partida fica aguardando quando o jogador desconectado precisa agir. Não há
  bot substituto ou timeout nesta sprint.

## Descoberta

A descoberta deriva o prefixo dos três primeiros octetos do IPv4 Wi-Fi e testa
os hosts `1..254` em lotes. Isso elimina entrada manual de IP e não depende de
multicast/mDNS.

Limitações:

- pressupõe uma sub-rede `/24`, comum em redes domésticas;
- redes com isolamento entre clientes impedem multiplayer local;
- VPNs e redes corporativas podem bloquear conexões diretas;
- a permissão de rede local precisa ser aceita no iOS.

## Development build

Depois de instalar dependências, gere o projeto nativo novamente:

```bash
npx expo prebuild --clean
npx expo run:android
# ou
npx expo run:ios
```

Os dispositivos devem usar builds gerados a partir da mesma versão do protocolo.

## Testes

```bash
npm test
```

Cobertura principal:

- framing e versão do protocolo;
- regras de entrada, pronto e início exclusivo pelo Host;
- rejeição de impersonação;
- snapshots com revisão consistente;
- não vazamento de baralho/cartas adversárias;
- contestação e perda de influência;
- jogador eliminado sem permissão para contestar;
- partida completa até `GAME_OVER`;
- desconexão, rejeição de comando e reconexão lógica.

Os testes TCP entre dispositivos físicos ainda devem ser executados em dois
aparelhos iOS/Android na mesma rede, pois o teste automatizado valida a autoridade
e sincronização sem depender de hardware.

## Plano técnico implementado

1. Protocolo versionado e framing.
2. Descoberta e transporte TCP.
3. Lobby e identidade efêmera.
4. Autoridade integrada ao `GameEngine`.
5. Snapshots privados por jogador.
6. UI de criação, descoberta, lobby e partida.
7. Testes de sincronização, privacidade, partida completa e desconexão.
