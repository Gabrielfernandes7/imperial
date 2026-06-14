import { NETWORK_PROTOCOL_VERSION } from './MessageTypes';

const MAX_BUFFER_LENGTH = 1024 * 1024;

export class JsonLineDecoder<TMessage> {
  private buffer = '';

  push(chunk: string): TMessage[] {
    this.buffer += chunk;
    if (this.buffer.length > MAX_BUFFER_LENGTH) {
      this.buffer = '';
      throw new Error('Mensagem de rede excedeu o limite permitido.');
    }

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    return lines
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const message = JSON.parse(line) as { version?: number };
        if (message.version !== NETWORK_PROTOCOL_VERSION) {
          throw new Error('Versão de protocolo incompatível.');
        }
        return message as TMessage;
      });
  }
}

export function encodeMessage(message: unknown): string {
  return `${JSON.stringify(message)}\n`;
}
