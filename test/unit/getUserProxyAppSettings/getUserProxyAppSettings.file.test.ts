import fs from 'node:fs';
import { getUserProxyAppSettings } from '@/helpers/getUserProxyAppSettings';
import { UserProxyAppSettingsArgs } from '@/types';

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

describe('getUserProxyAppSettings (file config, mocked fs)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('Читает настройки из файла, если он существует', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({
        host: 'file-host',
        port: 9999,
      } satisfies Partial<UserProxyAppSettingsArgs>),
    );

    const settings = getUserProxyAppSettings([]);

    expect(settings.host).toBe('file-host');
    expect(settings.port).toBe(9999);
  });

  it('Возвращает дефолтные настройки, если файла нет', () => {
    mockedFs.existsSync.mockReturnValue(false);

    const settings = getUserProxyAppSettings([]);

    expect(settings.host).toBe('localhost');
    expect(settings.port).toBe(10888);
  });
});
