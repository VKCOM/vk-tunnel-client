import minimist from 'minimist';
import fs from 'node:fs';
import { UserProxyAppSettings, UserProxyAppSettingsArgs } from '../types';
import { DEFAULT_USER_PROXY_APP_SETTINGS, USER_SETTINGS_FILE_NAME } from '../constants';

export function getUserProxyAppSettings(): UserProxyAppSettings {
  let userConfigFile: Partial<UserProxyAppSettingsArgs> = {};
  const cliArgs = minimist<Partial<UserProxyAppSettingsArgs>>(process.argv.slice(2), {
    string: ['_'],
  });

  if (fs.existsSync(`./${USER_SETTINGS_FILE_NAME}`)) {
    userConfigFile = JSON.parse(fs.readFileSync(`./${USER_SETTINGS_FILE_NAME}`, 'utf8'));
  }

  const {
    'http-protocol': httpProtocol,
    'ws-protocol': wsProtocol,
    ...userSettings
  } = Object.assign({ ...DEFAULT_USER_PROXY_APP_SETTINGS, ...userConfigFile }, cliArgs);

  return { httpProtocol, wsProtocol, ...userSettings };
}
