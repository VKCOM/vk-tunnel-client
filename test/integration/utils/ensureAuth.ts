import Configstore from 'configstore';
import { USER_STORAGE_NAME } from '@/constants';

export function ensureAuth() {
  const userStoredInfo = new Configstore(USER_STORAGE_NAME, {});
  const accessToken = userStoredInfo.get('accessToken');
  const userId = userStoredInfo.get('userId');

  if (!accessToken || !userId) {
    throw new Error(
      [
        '❌ Не найдены accessToken и/или userId в локальном конфиге.',
        'Чтобы протестировать тесты:',
        '1. Запусти туннель с авторизацией.',
        '2. Повтори запуск тестов.',
      ].join('\n'),
    );
  }
}
