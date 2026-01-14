import fs from 'node:fs';
import { getUserProxyAppSettings } from '@/helpers/getUserProxyAppSettings';

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

describe('getUserProxyAppSettings (invalid args)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it('Выбрасывает ошибку, если CLI аргумент имеет неверный тип', () => {
    const invalidArgs = ['--host=1'];

    expect(() => getUserProxyAppSettings(invalidArgs as any)).toThrowError();
  });

  it('Выбрасывает ошибку, если конфигурационный файл содержит неверные типы', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({
        host: ['array-instead-of-string'],
        port: 'not-a-number',
      }),
    );

    expect(() => getUserProxyAppSettings([])).toThrowError();
  });

  it('Выбрасывает ошибку, если env переменные имеют неверные типы', () => {
    vi.stubEnv('PROXY_PORT', 'not-a-number');
    vi.stubEnv('PROXY_HOST', 'ok-host');

    expect(() => getUserProxyAppSettings([])).toThrowError();
  });
});
