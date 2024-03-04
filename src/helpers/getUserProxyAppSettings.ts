import minimist from 'minimist';
import fs from 'node:fs';
import { UserProxyAppSettings } from '../types';
import { DEFAULT_USER_PROXY_APP_SETTINGS, USER_SETTINGS_FILE_NAME } from '../constants';

export function getUserProxyAppSettings(): UserProxyAppSettings {
  let userConfigFile: Partial<UserProxyAppSettings> = {};
  const cliArgs = minimist<Partial<UserProxyAppSettings>>(process.argv.slice(2), { string: ['_'] });

  if (fs.existsSync(`./${USER_SETTINGS_FILE_NAME}`)) {
    userConfigFile = JSON.parse(fs.readFileSync(`./${USER_SETTINGS_FILE_NAME}`, 'utf8'));
  }

  return Object.assign(Object.assign(DEFAULT_USER_PROXY_APP_SETTINGS, userConfigFile), cliArgs);
}
