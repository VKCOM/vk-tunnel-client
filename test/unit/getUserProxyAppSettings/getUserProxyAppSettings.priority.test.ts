import fs from 'node:fs';
import { getUserProxyAppSettings } from '@/helpers/getUserProxyAppSettings';
import { HttpProtocol, WsProtocol } from '@/types';

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

const mockedFs = fs as unknown as {
  existsSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

describe('getUserProxyAppSettings (priority check)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it('CLI > ENV > file > defaults', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({
        host: 'file-host',
        port: 1111,
      }),
    );

    vi.stubEnv('PROXY_HOST', 'env-host');
    vi.stubEnv('PROXY_PORT', '2222');

    const settings = getUserProxyAppSettings([
      '--host=cli-host',
      '--port=3333',
      '--http-protocol=https',
      '--ws-protocol=wss',
    ]);

    expect(settings.host).toBe('cli-host');
    expect(settings.port).toBe(3333);

    expect(settings.httpProtocol).toBe(HttpProtocol.HTTPS);
    expect(settings.wsProtocol).toBe(WsProtocol.WSS);
  });
});
