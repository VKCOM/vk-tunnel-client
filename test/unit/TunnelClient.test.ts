import { TunnelClient } from '@/entities/TunnelClient';
import { RawData, WebSocket } from 'ws';
import { parseHttpRequest } from '@/helpers';
import { HttpProtocol, WsProtocol, UserProxyAppSettings } from '@/types';

vi.mock('@/helpers', () => ({ parseHttpRequest: vi.fn() }));

describe('TunnelClient (pure computation methods)', () => {
  let client: TunnelClient;
  const socket = {} as WebSocket;
  const tunnelData = {
    tunnelHost: 'tunnel.vk.com',
    tunnelUrl: 'https://tunnel.vk.com/connect',
    tunnelToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5hbWUiOiJ',
    url: 'https://localhost:3000',
    userId: 123456,
  };

  const userSettings = {
    host: 'myhost',
    wsProtocol: WsProtocol.WS,
    httpProtocol: HttpProtocol.HTTP,
    insecure: 0,
    wsOrigin: 1,
    port: 1234,
    timeout: 5000,
  } as UserProxyAppSettings;

  beforeEach(() => {
    client = new TunnelClient(socket, tunnelData, userSettings);
  });

  it('parseProxyRequest разбивает RawData корректно', () => {
    const rawData = Buffer.from('00000001HGET /test HTTP/1.1\n\n');
    (parseHttpRequest as any).mockReturnValue({ headers: {}, uri: '/test', method: 'GET' });

    const result = (client as any).parseProxyRequest(rawData as RawData);

    expect(result.seq).toBe('00000001');
    expect(result.messageType).toBe('H');
    expect(result.payload.toString()).toContain('GET /test');
    expect(result.endpoint).toBe('/test');
  });

  it('transformPayload заменяет Host и Accept-Encoding', () => {
    const rawPayload = Buffer.from('GET / HTTP/1.1\nHost: example.com\nAccept-Encoding: gzip\n\n');
    const transformed = (client as any).transformPayload(rawPayload);

    expect(transformed).toContain('Host: myhost');
    expect(transformed).toContain('Accept-Encoding: gzip;q=0,deflate;q=0');
  });
});
