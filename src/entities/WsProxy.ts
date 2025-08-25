import WebSocket from 'ws';
import { logger } from './Logger';
import {
  MessageTypeToSend,
  MessageTypeFromBack,
  ProxiedNetworkPacket,
  SendResponseToProxyServer,
  UserProxyAppSettings,
  ParseRequestResult,
} from '../types';

export class WsProxy {
  private connections: Map<string, WebSocket> = new Map();

  public constructor(private readonly userSettings: UserProxyAppSettings) {}

  private filterWebSocketHeaders(headers: ParseRequestResult['headers']) {
    const allowedHeaders = [
      'Sec-WebSocket-Protocol',
      'Sec-WebSocket-Extensions',
      'Sec-WebSocket-Key',
      'Sec-WebSocket-Version',
    ];

    return Object.fromEntries(
      Object.entries(headers).filter(([key]) => allowedHeaders.includes(key)),
    );
  }

  private closeConnection(seq: string) {
    this.connections.get(seq)?.close();
  }

  private createConnection(
    seq: string,
    endpoint: string,
    headers: ParseRequestResult['headers'],
    sendResponseToVkProxyServer: SendResponseToProxyServer,
  ) {
    const subprotocol = headers['Sec-Websocket-Protocol'];
    const proxiedServerOrigin = `${this.userSettings.wsProtocol}://${this.userSettings.host}:${this.userSettings.port}`;
    const proxiedServerUrl = `${proxiedServerOrigin}${endpoint}`;

    const websocket = new WebSocket(proxiedServerUrl, subprotocol, {
      host: this.userSettings.wsOrigin ? this.userSettings.host : undefined,
      origin: this.userSettings.wsOrigin ? proxiedServerOrigin : undefined,
      headers: this.filterWebSocketHeaders(headers),
    });

    websocket.on('error', (msg) => logger.error('Connection error for ' + seq, msg));

    websocket.on('open', () => {
      websocket.on('message', (data, isBinary) => {
        logger.debug('incoming ws message from service', seq, data, isBinary);

        const dataBuf = Array.isArray(data)
          ? Buffer.concat(data)
          : Buffer.isBuffer(data)
          ? data
          : Buffer.from(new Uint8Array(data));

        const seqBuf = Buffer.from(seq, 'utf8');
        const typeBuf = Buffer.from(MessageTypeToSend.WEBSOCKET, 'utf8');
        const stringMessage = `${seq}${MessageTypeToSend.WEBSOCKET}${data}`;

        const finalMessage = isBinary ? Buffer.concat([seqBuf, typeBuf, dataBuf]) : stringMessage;

        sendResponseToVkProxyServer(finalMessage, () => {
          logger.debug('send reply', seq, data, isBinary);
        });
      });
    });

    websocket.on('upgrade', (msg) => {
      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        ...Object.entries(msg.headers).map(([key, value]) => `${key}: ${value}`),
      ];
      const response = responseHeaders.join('\n') + '\n\n';

      sendResponseToVkProxyServer(`${seq}${MessageTypeToSend.HTTP}${response}`, () => {
        logger.debug('send reply upgrade', seq, response.toString());
      });
    });

    this.connections.set(seq, websocket);
  }

  public async proxy(
    request: ProxiedNetworkPacket,
    sendResponseToVkTunnelBack: SendResponseToProxyServer,
  ) {
    const { messageType, payload, isWebsocketUpgrade, seq, endpoint, parsedRequest } = request;

    if (messageType === MessageTypeFromBack.WEBSOCKET_CLOSE) {
      return this.closeConnection(seq);
    }

    if (messageType !== MessageTypeFromBack.HTTP) {
      this.connections.get(seq)?.send(payload, {}, () => {
        logger.debug('WS REQUEST', 'seq: ' + seq, messageType, endpoint, payload);
      });
    }

    if (isWebsocketUpgrade) {
      this.createConnection(seq, endpoint, parsedRequest.headers, sendResponseToVkTunnelBack);
    }
  }
}
