import { HttpProxy } from '@/entities/HttpProxy';
import {
  UserProxyAppSettings,
  ProxiedNetworkPacket,
  HttpProtocol,
  WsProtocol,
  MessageTypeFromBack,
} from '@/types';

export const USER_SETTINGS: UserProxyAppSettings = {
  httpProtocol: HttpProtocol.HTTP,
  wsProtocol: WsProtocol.WS,
  timeout: 5000,
  host: 'localhost',
  port: 3000,
  insecure: 0,
  wsOrigin: 0,
};

export const PACKET_DATA: ProxiedNetworkPacket = {
  seq: '00000001',
  messageType: MessageTypeFromBack.HTTP,
  endpoint: '/test',
  isWebsocketUpgrade: false,
  payload: Buffer.from('GET /test HTTP/1.1\r\nHost: localhost\r\n\r\n'),
  parsedRequest: {
    method: 'GET',
    uri: '/test',
    headers: { Host: 'localhost' },
    body: '',
  },
};

describe('HttpProxy (unit)', () => {
  let httpProxy: HttpProxy;
  const sendResponseMock = vi.fn();

  beforeEach(() => {
    httpProxy = new HttpProxy(USER_SETTINGS);

    vi.restoreAllMocks();
  });

  it('Должен получить ответ от локального сервера, распарсить его и отправить на бекенд туннеля', async () => {
    const fakeResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/plain' },
      data: Buffer.from('Hello World'),
    };

    (httpProxy as any).getResponseFromProxiedServer = vi.fn(() => Promise.resolve(fakeResponse));

    await httpProxy.proxy(PACKET_DATA, sendResponseMock);

    expect(sendResponseMock).toHaveBeenCalledTimes(1);

    const sentBuffer = sendResponseMock.mock.calls[0][0] as Buffer;
    const bufferText = sentBuffer.toString();

    expect(bufferText).toContain('HTTP/1.1 200 OK');
    expect(bufferText).toContain('Content-Type: text/plain');
    expect(bufferText).toContain('Hello World');
  });

  it('Должен получить ответ от локального сервера, распарсить его и отправить на бекенд туннеля, сохранив все заголовки', async () => {
    const fakeResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'Set-Cookie': ['a=1', 'b=2'] },
      data: Buffer.from('data'),
    };

    (httpProxy as any).getResponseFromProxiedServer = vi.fn(() => Promise.resolve(fakeResponse));

    await httpProxy.proxy(PACKET_DATA, sendResponseMock);

    const sentBuffer = sendResponseMock.mock.calls[0][0] as Buffer;
    const bufferText = sentBuffer.toString();
    expect(bufferText).toContain('Set-Cookie: a=1');
    expect(bufferText).toContain('Set-Cookie: b=2');
  });

  it('Не отправляет ответ на бек туннеля, если локальный сервер не отвечает', async () => {
    (httpProxy as any).getResponseFromProxiedServer = vi.fn(() => Promise.resolve(undefined));

    await httpProxy.proxy(PACKET_DATA, sendResponseMock);

    expect(sendResponseMock).not.toHaveBeenCalled();
  });
});
