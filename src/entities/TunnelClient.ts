import { RawData, WebSocket } from 'ws';
import chalk from 'chalk';
import { WsProxy } from './WsProxy';
import { HttpProxy } from './HttpProxy';
import { logger } from './Logger';
import { showSuccessLog, parseHttpRequest } from '../helpers';
import {
  MessageTypeFromBack,
  ProxiedNetworkPacket,
  TunnelConnectionData,
  UserProxyAppSettings,
} from '../types';

export class TunnelClient {
  private readonly SEQ_BEGIN = 0;
  private readonly SEQ_END = 8;
  private readonly MSG_TYPE_BEGIN = 8;
  private readonly MSG_TYPE_END = 9;
  private readonly PAYLOAD_BEGIN = 9;

  private readonly DISABLE_COMPRESS = 'gzip;q=0,deflate;q=0';
  private readonly ACCEPT_ENCODING = 'Accept-Encoding';

  private HttpProxy: HttpProxy;
  private WsProxy: WsProxy;

  public constructor(
    private readonly socket: WebSocket,
    private readonly tunnelData: TunnelConnectionData,
    private readonly userSettings: UserProxyAppSettings,
  ) {
    this.HttpProxy = new HttpProxy(userSettings);
    this.WsProxy = new WsProxy(userSettings);

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = this.userSettings.insecure.toString();
  }

  public onConnectionOpen() {
    showSuccessLog();
    const httpTunnelUrl = this.tunnelData.tunnelUrl;
    const wsTunnelUrl = this.tunnelData.tunnelUrl.replace('https', 'wss');
    console.log(chalk.bold(`https: ${httpTunnelUrl}\nwss: ${wsTunnelUrl}`));
  }

  public onConnectionClose(code: string) {
    logger.info('disconnected, code:', code);
  }

  public onConnectionError(error: string) {
    logger.error('wsMain error', error);
  }

  private sendResponseToVkTunnelBack(data: Buffer | string, callback?: (error?: Error) => void) {
    this.socket.send(data, callback);
  }

  private transformPayload(payload: Buffer[] | ArrayBuffer | Buffer) {
    return payload
      .toString()
      .replace(/Accept-Encoding:.*/, this.ACCEPT_ENCODING + ': ' + this.DISABLE_COMPRESS)
      .replace(/Host: .*/, 'Host: ' + this.userSettings.host);
  }

  private parseProxyRequest(data: RawData): ProxiedNetworkPacket {
    const seq = data.slice(this.SEQ_BEGIN, this.SEQ_END).toString();
    const rawPayload = data.slice(this.PAYLOAD_BEGIN);
    const messageType = data
      .slice(this.MSG_TYPE_BEGIN, this.MSG_TYPE_END)
      .toString() as MessageTypeFromBack;

    const isWebSocketBinary = messageType === MessageTypeFromBack.WEBSOCKET_BINARY;
    const payload = isWebSocketBinary ? rawPayload : this.transformPayload(rawPayload);
    const parsedRequest = parseHttpRequest(payload.toString());

    const upgradeHeader = parsedRequest.headers['Upgrade'] || '';
    const isWebsocketUpgrade = Array.isArray(upgradeHeader)
      ? upgradeHeader.some((header) => header.toLowerCase() === 'websocket')
      : upgradeHeader.toLowerCase() === 'websocket';

    const endpoint = payload.toString().split(' ')[1];

    return { seq, endpoint, messageType, isWebsocketUpgrade, parsedRequest, payload };
  }

  public async onMessage(data: RawData) {
    const packetData = this.parseProxyRequest(data);

    packetData.parsedRequest.headers['Host'] = this.userSettings.host;
    packetData.parsedRequest.headers[this.ACCEPT_ENCODING] = this.DISABLE_COMPRESS;

    if (packetData.messageType === MessageTypeFromBack.HTTP && !packetData.isWebsocketUpgrade) {
      this.HttpProxy.proxy(packetData, this.sendResponseToVkTunnelBack.bind(this));
    } else {
      this.WsProxy.proxy(packetData, this.sendResponseToVkTunnelBack.bind(this));
    }
  }
}
