import http, { RequestOptions } from 'http';
import https from 'https';
import { logger } from './Logger';
import { ProxiedNetworkPacket, SendResponseToProxyServer, UserProxyAppSettings } from '../types';
import { URL } from 'url';

export class HttpProxy {
  public constructor(private readonly userSettings: UserProxyAppSettings) {}

  private getHttpModule() {
    return this.userSettings.httpProtocol === 'https' ? https : http;
  }

  private getRequestOptions(
    parsedRequest: ProxiedNetworkPacket['parsedRequest'],
    proxiedServerUrl: string,
  ): RequestOptions {
    const url = new URL(proxiedServerUrl);

    return {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: parsedRequest.method,
      headers: parsedRequest.headers,
      timeout: this.userSettings.timeout,
    };
  }

  public async proxy(
    packetData: ProxiedNetworkPacket,
    sendResponseToVkTunnelBack: SendResponseToProxyServer,
  ) {
    const { seq, parsedRequest, messageType, endpoint } = packetData;
    const proxiedServerUrl = `${this.userSettings.httpProtocol}://${this.userSettings.host}:${this.userSettings.port}${parsedRequest.uri}`;
    const httpModule = this.getHttpModule();
    const requestOptions = this.getRequestOptions(parsedRequest, proxiedServerUrl);

    const req = httpModule.request(requestOptions, (res) => {
      const statusLine = `HTTP/1.1 ${res.statusCode} ${res.statusMessage}\r\n`;

      let headersString = '';
      for (const [key, value] of Object.entries(res.headers)) {
        if (key === 'transfer-encoding') continue;

        if (Array.isArray(value)) {
          for (const v of value) {
            headersString += `${key}: ${v}\r\n`;
          }
        } else if (value !== undefined) {
          headersString += `${key}: ${value}\r\n`;
        }
      }

      const headerBuffer = Buffer.from(statusLine + headersString + '\r\n', 'utf8');

      sendResponseToVkTunnelBack(
        Buffer.concat([Buffer.from(seq, 'utf8'), Buffer.from(messageType, 'utf8'), headerBuffer]),
      );

      res.on('data', (chunk) => {
        const dataBuffer = Buffer.concat([
          Buffer.from(seq, 'utf8'),
          Buffer.from(messageType, 'utf8'),
          chunk,
        ]);
        sendResponseToVkTunnelBack(dataBuffer);
      });

      res.on('end', () => {
        logger.debug(
          'REQUEST',
          `seq: ${seq}`,
          `type: ${messageType.charCodeAt(0)}`,
          `endpoint: ${endpoint}`,
        );
        const realIp = parsedRequest['headers']['X-Real-Ip'] || '-';
        const statusCode = res.statusCode || '-';
        const host = parsedRequest['headers']['Host'] || '-';
        const method = parsedRequest['method'] || '-';
        const uri = parsedRequest['uri'] || '-';
        const ua = parsedRequest['headers']['User-Agent'] || '-';
        logger.info(`${realIp} ${statusCode} ${host} ${method} ${uri} ${ua}`);
      });
    });

    req.on('error', (err) => {
      logger.error('HTTP proxy error:', err.message);
    });

    if (parsedRequest.body) {
      req.write(parsedRequest.body);
    }

    req.end();
  }
}
