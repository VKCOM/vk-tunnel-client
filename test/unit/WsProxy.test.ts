import { WsProxy } from '@/entities/WsProxy';
import {
  UserProxyAppSettings,
  ProxiedNetworkPacket,
  HttpProtocol,
  WsProtocol,
  MessageTypeFromBack,
} from '@/types';
import WebSocket from 'ws';

describe('WsProxy (unit)', () => {
  const VALID_SEQ = 'SEQ123';
  const TEST_ENDPOINT = '/chat';
  const TEST_HEADERS = {
    'Sec-WebSocket-Protocol': 'json',
    'Sec-WebSocket-Extensions': 'permessage-deflate',
    'Sec-WebSocket-Key': 'abc123',
    'Sec-WebSocket-Version': '13',
    'X-Custom-Header': 'SHOULD_BE_FILTERED',
  };
  const MOCK_USER_SETTINGS: UserProxyAppSettings = {
    httpProtocol: HttpProtocol.HTTP,
    wsProtocol: WsProtocol.WS,
    host: 'localhost',
    port: 8080,
    timeout: 5000,
    insecure: 0,
    wsOrigin: 1,
    app_id: undefined,
    staging: undefined,
    endpoints: undefined,
  };

  let wsProxy: WsProxy;

  const mockSend = vi.fn((data: any, options: any, callback?: (err?: Error) => void) => {
    if (callback) callback();
  });
  const mockClose = vi.fn();

  beforeEach(() => {
    wsProxy = new WsProxy(MOCK_USER_SETTINGS);
    vi.clearAllMocks();
  });

  it('filterWebSocketHeaders должен возвращать только разрешённые заголовки', () => {
    const filtered = (wsProxy as any).filterWebSocketHeaders(TEST_HEADERS);

    expect(filtered).toEqual({
      'Sec-WebSocket-Protocol': 'json',
      'Sec-WebSocket-Extensions': 'permessage-deflate',
      'Sec-WebSocket-Key': 'abc123',
      'Sec-WebSocket-Version': '13',
    });
    expect(filtered).not.toHaveProperty('X-Custom-Header');
  });

  it('closeConnection должен закрывать сохранённое соединение', () => {
    const fakeWs = { send: mockSend, close: mockClose } as unknown as WebSocket;
    (wsProxy as any).connections.set(VALID_SEQ, fakeWs);

    (wsProxy as any).closeConnection(VALID_SEQ);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('proxy должен закрывать соединение при messageType=WEBSOCKET_CLOSE', async () => {
    const fakeWs = { send: mockSend, close: mockClose } as unknown as WebSocket;
    (wsProxy as any).connections.set(VALID_SEQ, fakeWs);

    const packet: ProxiedNetworkPacket = {
      seq: VALID_SEQ,
      endpoint: TEST_ENDPOINT,
      payload: Buffer.from(''),
      messageType: MessageTypeFromBack.WEBSOCKET_CLOSE,
      isWebsocketUpgrade: false,
      parsedRequest: { method: 'GET', uri: TEST_ENDPOINT, headers: {}, body: '' },
    };

    await wsProxy.proxy(packet, vi.fn());

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
