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
  private userSettings: UserProxyAppSettings;
  private logger: Logger;

  public constructor(userSettings: UserProxyAppSettings, logger: Logger) {
    this.userSettings = userSettings;
    this.logger = logger;
  }

  private filterHeaders(payload: string, proxyHost: string) {
    return payload
      .replace(/Accept-Encoding:.*/, WsProxy.ACCEPT_ENCODING + ': ' + WsProxy.DISABLE_COMPRESS)
      .replace(/Host: .*/, 'Host: ' + proxyHost);
  }

  private closeConnection(seq: string) {
    this.connections[seq].close();
  }

  private createConnection(
    seq: string,
    proxiedServerUrl: string,
    sendResponseToVkProxyServer: SendResponseToProxyServer,
  ) {
    this.connections[seq] = new WebSocket(proxiedServerUrl, [], {});
    this.connections[seq].on('error', (msg) => {
      this.logger.error('Connection error for ' + seq, msg);
    });

    this.connections[seq].on('upgrade', (msg) => {
      let response = ['HTTP/1.1 101 Switching Protocols'];
      let keys = Object.keys(msg.headers);
      for (let i = 0; i < keys.length; i++) {
        response.push(`${keys[i]}:${msg.headers[keys[i]]}`);
      }
      response.push('\n');
      sendResponseToVkProxyServer(seq + MessageType.HTTP + response.join('\n'), () => {
        this.logger.debug('send reply upgrade', seq, response.toString());
      });
    });

    this.connections[seq].on('open', () => {
      this.connections[seq].on('message', (data) => {
        this.logger.debug('incoming ws message from service', seq, data);
        sendResponseToVkProxyServer(`${seq}${MessageType.WEBSOCKET}${data}`, () => {
          this.logger.debug('send reply', seq, data);
        });
      });
    });
  }

  public async proxy(
    request: ProxiedNetworkPacket,
    sendResponseToVkProxyServer: SendResponseToProxyServer,
  ) {
    const { messageType, payload, isWebsocketUpgrade, seq, endpoint } = request;

    if (messageType !== MessageType.HTTP) {
      const filteredPayload = this.filterHeaders(payload, this.userSettings.host);

      if (messageType === MessageType.WEBSOCKET_CLOSE) {
        return this.closeConnection(seq);
      }

      this.connections[seq].send(filteredPayload, {}, () => {
        this.logger.debug('WS REQUEST', 'seq: ' + seq, messageType, endpoint, filteredPayload);
      });
    }

    if (isWebsocketUpgrade) {
      const proxiedServerUrl = `${this.userSettings.wsProtocol}://${this.userSettings.host}:${this.userSettings.port}${endpoint}`;
      this.createConnection(seq, proxiedServerUrl, sendResponseToVkProxyServer);
    }
  }
}
