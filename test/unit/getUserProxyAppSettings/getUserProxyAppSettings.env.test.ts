import { getUserProxyAppSettings } from '@/helpers/getUserProxyAppSettings';
import { HttpProtocol, WsProtocol } from '@/types';

describe('getUserProxyAppSettings (ENV)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('Должен брать значения из ENV', () => {
    process.env.PROXY_HTTP_PROTO = 'https';
    process.env.PROXY_WS_PROTO = 'wss';
    process.env.PROXY_PORT = '4000';
    process.env.PROXY_HOST = 'envhost.local';

    const settings = getUserProxyAppSettings([]);

    expect(settings.httpProtocol).toBe(HttpProtocol.HTTPS);
    expect(settings.wsProtocol).toBe(WsProtocol.WSS);
    expect(settings.port).toBe(4000);
    expect(settings.host).toBe('envhost.local');
  });

  it('Должен парсить boolean/number из ENV', () => {
    process.env.PROXY_WS_ORIGIN = '0';

    const settings = getUserProxyAppSettings([]);

    expect(settings.wsOrigin).toBe(0);
  });
});
