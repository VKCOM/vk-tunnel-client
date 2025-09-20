import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { vkTunnel } from '@/vkTunnel';
import { ensureAuth } from './utils/ensureAuth';

describe.sequential('Интеграционный тест WebSocket через туннель', () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port: number;

  let tunnelData: Awaited<ReturnType<typeof vkTunnel>>['tunnelData'];
  let closeTunnelConnection: () => void;

  beforeAll(async () => {
    ensureAuth();

    server = http.createServer();
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (msg, isBinary) => {
        ws.send(msg, { binary: isBinary });
      });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));

    const address = server.address();

    if (typeof address !== 'object' || !address?.port) {
      throw new Error('Failed to get server port');
    }

    port = address.port;
    vi.stubEnv('PROXY_PORT', port.toString());

    const tunnel = await vkTunnel();
    tunnelData = tunnel.tunnelData;
    closeTunnelConnection = tunnel.closeTunnelConnection;
  });

  afterAll(async () => {
    wss.close();
    server.close();
    closeTunnelConnection();
    vi.unstubAllEnvs();
  });

  it('Устанавливается соединение и работает echo', async () => {
    const wsUrl = tunnelData.tunnelUrl.replace('https', 'wss');
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.send('hello through tunnel');
      });

      ws.on('message', (data) => {
        expect(data.toString()).toBe('hello through tunnel');
        ws.close();
        resolve();
      });

      ws.on('error', reject);
    });
  });

  it('Поддерживается бинарный формат', async () => {
    const wsUrl = tunnelData.tunnelUrl.replace('https', 'wss');
    const ws = new WebSocket(wsUrl);

    const payload = Buffer.from([1, 2, 3, 4]);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.send(payload);
      });

      ws.on('message', (data, isBinary) => {
        expect(isBinary).toBe(true);
        expect(Buffer.compare(data as Buffer, payload)).toBe(0);
        ws.close();
        resolve();
      });

      ws.on('error', reject);
    });
  });
});
