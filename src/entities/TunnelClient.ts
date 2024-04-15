import { RawData, WebSocket } from 'ws';
import chalk from 'chalk';
import httpParser from 'http-string-parser';
import pino, { Logger } from 'pino';
import pinoPretty from 'pino-pretty';
import { WsProxy } from './WsProxy';
import { HttpProxy } from './HttpProxy';
import { showSuccessLog } from '../helpers';
import {
  MessageType,
  ProxiedNetworkPacket,
  TunnelConnectionData,
  UserProxyAppSettings,
} from '../types';

export class TunnelClient {
  private SEQ_BEGIN = 0;
  private SEQ_END = 8;
  private MSG_TYPE_BEGIN = 8;
  private MSG_TYPE_END = 9;
  private PAYLOAD_BEGIN = 9;
  private DISABLE_COMPRESS = 'gzip;q=0,deflate;q=0';
  private ACCEPT_ENCODING = 'Accept-Encoding';

  private userSettings: UserProxyAppSettings;
  private tunnelData: TunnelConnectionData;
  private HttpProxy: HttpProxy;
  private WsProxy: WsProxy;
  private socket: WebSocket;
  private logger: Logger;

  public constructor(
    socket: WebSocket,
    userSettings: UserProxyAppSettings,
    tunnelData: TunnelConnectionData,
  ) {
    this.userSettings = userSettings;
    this.tunnelData = tunnelData;
    this.socket = socket;
    this.logger = pino(
      {
        level: 'info',
        base: {},
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      pinoPretty({
        colorize: true,
      }),
    );
    this.HttpProxy = new HttpProxy(userSettings, this.logger);
    this.WsProxy = new WsProxy(userSettings, this.logger);

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = this.userSettings.insecure.toString();
  }

  public onConnectionOpen() {
    showSuccessLog();
    const httpTunnelUrl = this.tunnelData.tunnelUrl;
    const wsTunnelUrl = this.tunnelData.tunnelUrl.replace('https', 'wss');
    console.log(chalk.bold(`https: ${httpTunnelUrl}\nwss: ${wsTunnelUrl}`));
  }

  public onConnectionClose(code: string) {
    this.logger.info('disconnected, code:', code);
  }

  public onConnectionError(error: string) {
    this.logger.error('wsMain error', error);
  }

  private sendResponseToVkProxyServer(data: Buffer | string, callback?: (error?: Error) => void) {
    this.socket.send(data, callback ? callback : undefined);
  }

  private parseProxyRequest(query: string): ProxiedNetworkPacket {
    const seq = query.slice(this.SEQ_BEGIN, this.SEQ_END);
    const messageType = query.slice(this.MSG_TYPE_BEGIN, this.MSG_TYPE_END) as MessageType;
    const payload = query.slice(this.PAYLOAD_BEGIN);
    const endpoint = payload.split(' ')[1];

    payload.split('\r');
    const parsedRequest = httpParser.parseRequest(payload.toString());

    const upgradeHeader = parsedRequest.headers['Upgrade'] || '';
    const isWebsocketUpgrade = upgradeHeader.toLowerCase() === 'websocket';

    return { seq, endpoint, messageType, isWebsocketUpgrade, parsedRequest, payload };
  }

  public async onMessage(data: RawData) {
    const query = data.toString();
    const packetData = this.parseProxyRequest(query);

    packetData.parsedRequest.headers['Host'] = this.userSettings.host;
    packetData.parsedRequest.headers[this.ACCEPT_ENCODING] = this.DISABLE_COMPRESS;

    if (packetData.messageType === MessageType.HTTP && !packetData.isWebsocketUpgrade) {
      this.HttpProxy.proxy(packetData, this.sendResponseToVkProxyServer.bind(this));
    } else {
      this.WsProxy.proxy(packetData, this.sendResponseToVkProxyServer.bind(this));
    }
  }
}
