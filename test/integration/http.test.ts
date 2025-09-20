import http from 'http';
import { vkTunnel } from '@/vkTunnel';
import { getFreePort } from './utils/getFreePort';
import axios from 'axios';
import { ensureAuth } from './utils/ensureAuth';

describe.sequential('Интеграционный тест HTTP через туннель', () => {
  let server: http.Server;
  let port: number;
  const OLD_ENV = process.env;

  let tunnelData: Awaited<ReturnType<typeof vkTunnel>>['tunnelData'];
  let closeTunnelConnection: () => void;

  beforeAll(async () => {
    ensureAuth();
    port = await getFreePort();

    server = http.createServer((req, res) => {
      if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: true }));
      } else if (req.url === '/echo' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(body);
        });
      } else if (req.url?.startsWith('/cookie')) {
        res.writeHead(200, { 'Set-Cookie': 'session=12345' });
        res.end('ok');
      } else if (req.url?.startsWith('/query')) {
        const url = new URL(req.url, `http://localhost:${port}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ query: url.searchParams.get('name') }));
      } else if (req.url?.startsWith('/error')) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => server.listen(port, resolve));
    process.env.PROXY_PORT = port.toString();

    const tunnel = await vkTunnel();
    tunnelData = tunnel.tunnelData;
    closeTunnelConnection = tunnel.closeTunnelConnection;
  });

  afterAll(async () => {
    server.close();
    closeTunnelConnection();
    process.env = OLD_ENV;
  });

  it('GET / базовый сценарий', async () => {
    const res = await axios.get(`${tunnelData.tunnelUrl}/`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ result: true });
  });

  it('POST /echo передача JSON', async () => {
    const payload = { foo: 'bar' };
    const res = await axios.post(`${tunnelData.tunnelUrl}/echo`, payload);

    expect(res.status).toBe(200);
    expect(res.data).toEqual(payload);
  });

  it('GET /cookie проброс заголовков Set-Cookie', async () => {
    const res = await axios.get(`${tunnelData.tunnelUrl}/cookie`);

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toContain('session=12345');
  });

  it('GET /query?name=test проброс query-параметров', async () => {
    const res = await axios.get(`${tunnelData.tunnelUrl}/query?name=test`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ query: 'test' });
  });

  it('GET /error проброс ошибки', async () => {
    try {
      await axios.get(`${tunnelData.tunnelUrl}/error`);
      throw new Error('Ожидалась ошибка');
    } catch (err: any) {
      expect(err.response.status).toBe(500);
      expect(err.response.data).toEqual({ error: 'internal' });
    }
  });
});
