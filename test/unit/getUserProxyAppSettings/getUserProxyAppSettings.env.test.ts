import { getUserProxyAppSettings } from '@/helpers/getUserProxyAppSettings';
import { HttpProtocol, WsProtocol } from '@/types';

describe('getUserProxyAppSettings (ENV)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('Должен брать значения из ENV', () => {
    vi.stubEnv('PROXY_HTTP_PROTO', 'https');
    vi.stubEnv('PROXY_WS_PROTO', 'wss');
    vi.stubEnv('PROXY_PORT', '4000');
    vi.stubEnv('PROXY_HOST', 'envhost.local');

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
