import axios, { AxiosResponse, Method } from 'axios';
import { logger } from './Logger';
import { ProxiedNetworkPacket, SendResponseToProxyServer, UserProxyAppSettings } from '../types';

export class HttpProxy {
  public constructor(private readonly userSettings: UserProxyAppSettings) {}

  private async getResponseFromProxiedServer(
    proxiedServerUrl: string,
    parsedRequest: ProxiedNetworkPacket['parsedRequest'],
  ) {
    return await axios({
      url: proxiedServerUrl,
      data: parsedRequest.body,
      headers: parsedRequest.headers,
      method: parsedRequest.method as Method,
      responseType: 'arraybuffer',
      timeout: this.userSettings.timeout,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    }).catch((error) => console.log(error));
  }

  private generateHeadersForVkTunnelBack(proxiedServerResponse: AxiosResponse) {
    let rawResponse = `HTTP/1.1 ${proxiedServerResponse.status} ${proxiedServerResponse.statusText}\r\n`;
    let keys = Object.keys(proxiedServerResponse.headers);

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'transfer-encoding') {
        continue;
      }

      if (
        keys[i] === 'content-length' &&
        proxiedServerResponse.headers.hasOwnProperty('transfer-encoding')
      ) {
        rawResponse += `content-length: ${proxiedServerResponse.data.length}\r\n`;
        continue;
      }
      rawResponse += `${keys[i]}:${proxiedServerResponse.headers[keys[i]]}\r\n`;
    }

    rawResponse += '\r\n';

    return rawResponse;
  }

  public async proxy(
    packetData: ProxiedNetworkPacket,
    sendResponseToVkTunnelBack: SendResponseToProxyServer,
  ) {
    const { seq, parsedRequest, messageType, endpoint } = packetData;
    const proxiedServerUrl = `${this.userSettings.httpProtocol}://${this.userSettings.host}:${this.userSettings.port}${parsedRequest.uri}`;

    const response = await this.getResponseFromProxiedServer(proxiedServerUrl, parsedRequest);

    if (!response) {
      return;
    }

    const buffer = Buffer.concat([
      Buffer.from(seq, 'utf8'),
      Buffer.from(messageType, 'utf8'),
      Buffer.from(this.generateHeadersForVkTunnelBack(response)),
      response.data,
    ]);

    sendResponseToVkTunnelBack(buffer, () => {
      logger.debug(
        'REQUEST',
        `seq: ${seq}`,
        `type: ${messageType.charCodeAt(0)}`,
        `endpoint: ${endpoint}`,
      );
      const realIp = parsedRequest['headers']['X-Real-Ip'] || '-';
      const statusCode = response.status || '-';
      const host = parsedRequest['headers']['Host'] || '-';
      const method = parsedRequest['method'] || '-';
      const uri = parsedRequest['uri'] || '-';
      const ua = parsedRequest['headers']['User-Agent'] || '-';
      const length = response.data.length;
      logger.info(`${realIp} ${statusCode} ${host} ${method} ${uri} ${ua} ${length}`);
    });
  }
}
