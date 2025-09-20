import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { vkTunnel } from '@/vkTunnel';
import { getFreePort } from './utils/getFreePort';
import { ensureAuth } from './utils/ensureAuth';

describe.sequential('Интеграционный тест WebSocket через туннель', () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port: number;
  const OLD_ENV = process.env;

  let tunnelData: Awaited<ReturnType<typeof vkTunnel>>['tunnelData'];
  let closeTunnelConnection: () => void;

  beforeAll(async () => {
    ensureAuth();
    port = await getFreePort();

    server = http.createServer();
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (msg, isBinary) => {
        ws.send(msg, { binary: isBinary });
      });
    });

    await new Promise<void>((resolve) => server.listen(port, resolve));
    process.env.PROXY_PORT = port.toString();

    const tunnel = await vkTunnel();
    tunnelData = tunnel.tunnelData;
    closeTunnelConnection = tunnel.closeTunnelConnection;
  });

  afterAll(async () => {
    wss.close();
    server.close();
    closeTunnelConnection();
    process.env = OLD_ENV;
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
