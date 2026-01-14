import { getUserProxyAppSettings } from '@/helpers/getUserProxyAppSettings';
import { HttpProtocol, WsProtocol } from '@/types';

describe('getUserProxyAppSettings (CLI args)', () => {
  it('Должен обрабатывать значения из CLI', () => {
    const settings = getUserProxyAppSettings([
      '--http-protocol=https',
      '--ws-protocol=wss',
      '--port=3000',
      '--host=myhost.local',
    ]);

    expect(settings.httpProtocol).toBe(HttpProtocol.HTTPS);
    expect(settings.wsProtocol).toBe(WsProtocol.WSS);
    expect(settings.port).toBe(3000);
    expect(settings.host).toBe('myhost.local');
  });

  it('Должен корректно парсить boolean/number аргументы', () => {
    const settings = getUserProxyAppSettings(['--insecure=1', '--ws-origin=0']);
    expect(settings.insecure).toBe(1);
    expect(settings.wsOrigin).toBe(0);
  });

  it('throws on invalid insecure value', () => {
    expect(() => getUserProxyAppSettings(['--insecure=2'])).toThrow();
  });

  it('throws on invalid ws-protocol', () => {
    expect(() => getUserProxyAppSettings(['--ws-protocol=ftp'])).toThrow();
  });

  it('throws on empty ws-origin', () => {
    expect(() => getUserProxyAppSettings(['--ws-origin='])).toThrow();
  });
});
