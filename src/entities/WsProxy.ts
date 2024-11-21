import WebSocket from 'ws';
import { Logger } from 'pino';
import {
  MessageType,
  ProxiedNetworkPacket,
  SendResponseToProxyServer,
  UserProxyAppSettings,
} from '../types';

export class WsProxy {
  private static ACCEPT_ENCODING = 'Accept-Encoding';
  private static DISABLE_COMPRESS = 'gzip;q=0,deflate;q=0';

  private connections: Record<string, WebSocket> = {};

  public constructor(
    private readonly userSettings: UserProxyAppSettings,
    private readonly logger: Logger,
  ) {}

  private transformPayload(payload: string, proxyHost: string) {
    return payload
      .replace(/Accept-Encoding:.*/, WsProxy.ACCEPT_ENCODING + ': ' + WsProxy.DISABLE_COMPRESS)
      .replace(/Host: .*/, 'Host: ' + proxyHost);
  }

  private filterWebSocketHeaders(headers: Record<string, string>) {
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
    this.connections[seq].close();
  }

  private createConnection(
    seq: string,
    proxiedServerUrl: string,
    headers: Record<string, string>,
    sendResponseToVkProxyServer: SendResponseToProxyServer,
  ) {
    const subprotocol = headers['Sec-Websocket-Protocol'];
    const host = this.userSettings.wsOrigin ? this.userSettings.host : undefined;
    const origin = this.userSettings.wsOrigin
      ? `${this.userSettings.wsProtocol}://${this.userSettings.host}:${this.userSettings.port}`
      : undefined;

    const websocket = new WebSocket(proxiedServerUrl, subprotocol, {
      host,
      origin,
      headers: this.filterWebSocketHeaders(headers),
    });

    websocket.on('error', (msg) => this.logger.error('Connection error for ' + seq, msg));

    websocket.on('open', () => {
      this.connections[seq].on('message', (data) => {
        this.logger.debug('incoming ws message from service', seq, data);
        sendResponseToVkProxyServer(`${seq}${MessageType.WEBSOCKET}${data}`, () => {
          this.logger.debug('send reply', seq, data);
        });
      });
    });

    websocket.on('upgrade', (msg) => {
      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        ...Object.entries(msg.headers).map(([key, value]) => `${key}: ${value}`),
      ];
      const response = responseHeaders.join('\n') + '\n\n';

      sendResponseToVkProxyServer(seq + MessageType.HTTP + response, () => {
        this.logger.debug('send reply upgrade', seq, response.toString());
      });
    });

    this.connections[seq] = websocket;
  }

  public async proxy(
    request: ProxiedNetworkPacket,
    sendResponseToVkProxyServer: SendResponseToProxyServer,
  ) {
    const { messageType, payload, isWebsocketUpgrade, seq, endpoint, parsedRequest } = request;

    if (messageType !== MessageType.HTTP) {
      const filteredPayload = this.transformPayload(payload, this.userSettings.host);

      if (messageType === MessageType.WEBSOCKET_CLOSE) {
        return this.closeConnection(seq);
      }

      this.connections[seq].send(filteredPayload, {}, () => {
        this.logger.debug('WS REQUEST', 'seq: ' + seq, messageType, endpoint, filteredPayload);
      });
    }

    if (isWebsocketUpgrade) {
      const proxiedServerUrl = `${this.userSettings.wsProtocol}://${this.userSettings.host}:${this.userSettings.port}${endpoint}`;

      this.createConnection(
        seq,
        proxiedServerUrl,
        parsedRequest.headers,
        sendResponseToVkProxyServer,
      );
    }
  }
}
