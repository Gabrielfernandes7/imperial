# Guia de Desenvolvimento - Projeto Imperial

Este documento serve como um guia técnico para desenvolvedores que desejam entender a arquitetura do projeto Imperial, como adicionar novas funcionalidades e como o sistema está estruturado.

---

## 1. Visão Geral da Arquitetura

O Imperial é construído com **React Native (Expo)** e **TypeScript**, utilizando uma separação clara entre a lógica de jogo (Engine), o estado (Store) e a interface (UI).

### Estrutura de Pastas Principal
- `src/game/`: O coração do jogo.
    - `engine/`: Controladores lógicos (TurnManager, ActionResolver).
    - `handlers/`: Implementações específicas de cada ação (Padrão Strategy).
    - `models/`: Definições de tipos e interfaces (MatchState, Player, etc).
    - `rules/`: Constantes e regras estáticas.
- `src/network/`: Protocolos de comunicação para multiplayer local.
- `src/store/`: Gerenciamento de estado global com Zustand.
- `src/ui/`: Componentes visuais, telas e temas.

---

## 2. Como Adicionar um Novo Personagem/Ação

Graças à refatoração para o **Padrão Strategy**, adicionar uma nova mecânica não exige modificar o motor principal.

### Passo a Passo:
1.  **Defina o Tipo:** Adicione o novo personagem em `src/game/models/Character.ts` e a nova ação em `src/game/models/ActionType.ts`.
2.  **Crie o Handler:** Na pasta `src/game/engine/handlers/`, crie um novo arquivo (ex: `SpyHandler.ts`) que implemente a interface `ActionHandler`.
3.  **Implemente a Lógica:** Escreva a lógica de execução dentro do método `execute()`. Você terá acesso ao estado completo do jogo via `ActionContext`.
4.  **Registre o Handler:** No arquivo `src/game/engine/ActionResolver.ts`, adicione sua nova classe ao mapeamento `handlers`.

---

## 3. Fluxo de Jogo e Estados

O jogo opera como uma máquina de estados finitos (`GamePhase`):
- `TURN_START` -> `ACTION_DECLARED` -> `CHALLENGE_PERIOD` -> `ACTION_RESOLUTION` -> `TURN_END`.

Cada ação pode ser bloqueável ou desafiável. Verifique `src/game/models/ActionType.ts` para configurar essas propriedades.

---

## 4. Sistema de Temas (Design System)

Utilizamos **Tailwind CSS (NativeWind)** para estilização.
- **Modo Claro:** Baseado em tons de creme e dourado imperial.
- **Modo Noturno:** Baseado em gradientes atmosféricos e tons profundos de azul (`night-void`, `night-deep`).

Para alterar cores globais, edite o `tailwind.config.js`.

---

## 5. Melhorias Mapeadas (Backlog Técnico)

Se você é um novo desenvolvedor, aqui estão algumas áreas que podem ser melhoradas:

1.  **Animações:** Implementar transições mais suaves entre as fases do jogo usando `moti` ou `react-native-reanimated`.
2.  **IA dos Bots:** Atualmente os bots seguem uma lógica simples. O `BotIA.ts` pode ser expandido para incluir árvores de decisão ou heurísticas de blefe.
3.  **Persistência:** Adicionar um histórico de partidas ganhas salvo localmente.
4.  **Sons e Feedback Háptico:** Adicionar sons de cartas e moedas para aumentar a imersão.
5.  **Refatoração de Bloqueios:** Atualmente os bloqueios ainda usam uma lógica centralizada. Eles poderiam seguir o mesmo padrão Strategy das ações.

---

## 6. Testes

Sempre rode os testes antes de submeter uma alteração:
```bash
npm run test:game
```
Os testes estão localizados em `src/game/tests/` e validam desde o embaralhamento até as regras complexas de Golpe de Estado.
