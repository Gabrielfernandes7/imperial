export enum BotPersonalityType {
  CAUTELOSO = 'CAUTELOSO',
  INTRIGANTE = 'INTRIGANTE',
  AGRESSIVO = 'AGRESSIVO',
}

export interface BotPersonality {
  type: BotPersonalityType;
  name: string;
  tagline: string;
  tableRead: string;
}

export const BOT_PERSONALITIES: Record<BotPersonalityType, BotPersonality> = {
  [BotPersonalityType.CAUTELOSO]: {
    type: BotPersonalityType.CAUTELOSO,
    name: 'O Cauteloso',
    tagline: 'Blefa pouco',
    tableRead: 'Prefere ações seguras e raramente compra brigas sem motivo.',
  },
  [BotPersonalityType.INTRIGANTE]: {
    type: BotPersonalityType.INTRIGANTE,
    name: 'A Intrigante',
    tagline: 'Bloqueia muito',
    tableRead: 'Usa bloqueios e informação para atrapalhar o ritmo da mesa.',
  },
  [BotPersonalityType.AGRESSIVO]: {
    type: BotPersonalityType.AGRESSIVO,
    name: 'O Agressivo',
    tagline: 'Contesta mais',
    tableRead: 'Pressiona moedas, desafia alegações e força decisões arriscadas.',
  },
};

export const BOT_PERSONALITY_ROTATION = [
  BotPersonalityType.CAUTELOSO,
  BotPersonalityType.INTRIGANTE,
  BotPersonalityType.AGRESSIVO,
] as const;
