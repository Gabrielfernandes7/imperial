import * as Network from 'expo-network';
import TcpSocket from 'react-native-tcp-socket';
import { generateId } from '../../game/utils/id';
import { TableSummary } from '../models/NetworkPlayer';
import { ClientMessageType, DEFAULT_GAME_PORT, ServerMessageType, envelope } from '../protocol/MessageTypes';
import { JsonLineDecoder, encodeMessage } from '../protocol/JsonLineCodec';
import { ServerMessage } from '../protocol/ServerMessages';
import { subnetPrefix } from '../utils/ip';

const BATCH_SIZE = 15;
const PROBE_TIMEOUT_MS = 600;

export class DiscoveryClient {
  private cancelled = false;

  async discover(
    onTableFound?: (table: TableSummary) => void,
    port = DEFAULT_GAME_PORT,
  ): Promise<TableSummary[]> {
    this.cancelled = false;
    const ipAddress = await Network.getIpAddressAsync();
    const prefix = subnetPrefix(ipAddress);
    if (!prefix) {
      throw new Error('Não foi possível identificar a rede Wi-Fi local.');
    }

    const tables = new Map<string, TableSummary>();
    for (let start = 1; start <= 254 && !this.cancelled; start += BATCH_SIZE) {
      const addresses = Array.from(
        { length: Math.min(BATCH_SIZE, 255 - start) },
        (_, index) => `${prefix}.${start + index}`,
      );
      const results = await Promise.all(
        addresses.map((address) => this.probe(address, port)),
      );
      results.forEach((table) => {
        if (table && !table.started && !tables.has(table.id)) {
          tables.set(table.id, table);
          onTableFound?.(table);
        }
      });
    }
    return [...tables.values()];
  }

  cancel(): void {
    this.cancelled = true;
  }

  private probe(
    host: string,
    port: number,
  ): Promise<TableSummary | undefined> {
    return new Promise((resolve) => {
      let settled = false;
      const decoder = new JsonLineDecoder<ServerMessage>();
      const socket = TcpSocket.createConnection(
        {
          host,
          port,
        },
        () => {
          socket.setEncoding('utf8');
          socket.write(
            encodeMessage(
              envelope(ClientMessageType.DISCOVER, {}, generateId()),
            ),
          );
        },
      );

      const finish = (table?: TableSummary) => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        resolve(table);
      };

      socket.setTimeout(PROBE_TIMEOUT_MS);
      socket.on('timeout', () => finish());
      socket.on('data', (data) => {
        try {
          const tableMessage = decoder
            .push(String(data))
            .find((message) => message.type === ServerMessageType.TABLE_INFO);
          if (tableMessage?.type === ServerMessageType.TABLE_INFO) {
            finish({
              ...tableMessage.payload.table,
              hostAddress: host,
            });
          }
        } catch {
          finish();
        }
      });
      socket.on('error', () => {
        finish();
      });
      socket.on('close', () => {
        finish();
      });
    });
  }
}
