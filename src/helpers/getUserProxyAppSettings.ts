import minimist from 'minimist';
import fs from 'node:fs';
import { UserProxyAppSettings, UserProxyAppSettingsArgs, HttpProtocol, WsProtocol } from '../types';
import {
  DEFAULT_PROXY_PORT,
  DEFAULT_PROXY_TIMEOUT,
  USER_SETTINGS_FILE_NAME,
  MAX_TIMEOUT,
  MAX_PORT,
} from '../constants';

export function getUserProxyAppSettings(argv: string[]): UserProxyAppSettings {
  const defaultSettings = getDefaultUserProxyAppSettings();
  const cliArgs = minimist<Partial<UserProxyAppSettingsArgs>>(argv, {
    string: ['_'],
  });
  let userConfigFile: Partial<UserProxyAppSettingsArgs> = {};

  if (fs.existsSync(`./${USER_SETTINGS_FILE_NAME}`)) {
    userConfigFile = JSON.parse(fs.readFileSync(`./${USER_SETTINGS_FILE_NAME}`, 'utf8'));
  }

  const {
    'http-protocol': httpProtocol,
    'ws-protocol': wsProtocol,
    'ws-origin': wsOrigin,
    ...userSettings
  } = Object.assign({}, defaultSettings, userConfigFile, cliArgs);

  return validateUserProxySettings({ wsOrigin, httpProtocol, wsProtocol, ...userSettings });
}

function getDefaultUserProxyAppSettings() {
  return {
    'http-protocol': process.env.PROXY_HTTP_PROTO ?? HttpProtocol.HTTP,
    'ws-protocol': process.env.PROXY_WS_PROTO ?? WsProtocol.WS,
    'timeout': Number(process.env.PROXY_TIMEOUT ?? DEFAULT_PROXY_TIMEOUT),
    'port': Number(process.env.PROXY_PORT ?? DEFAULT_PROXY_PORT),
    'host': process.env.PROXY_HOST ?? 'localhost',
    'insecure': 0,
    'ws-origin': Number(process.env.PROXY_WS_ORIGIN ?? 1),
    'app_id': undefined,
    'staging': undefined,
    'endpoints': undefined,
  };
}

function validateUserProxySettings(settings: UserProxyAppSettings): UserProxyAppSettings {
  const {
    httpProtocol,
    wsProtocol,
    timeout,
    host,
    port,
    insecure,
    wsOrigin,
    app_id,
    staging,
    endpoints,
  } = settings;

  if (!Object.values(HttpProtocol).includes(httpProtocol)) {
    throw new Error(`Invalid httpProtocol: ${httpProtocol}. Must be 'http' or 'https'`);
  }

  if (!Object.values(WsProtocol).includes(wsProtocol)) {
    throw new Error(`Invalid wsProtocol: ${wsProtocol}. Must be 'ws' or 'wss'`);
  }

  if (typeof timeout !== 'number' || timeout < 0 || !Number.isInteger(timeout)) {
    throw new Error(`Invalid timeout: ${timeout}. Must be a non-negative integer`);
  }

  if (timeout > MAX_TIMEOUT) {
    console.warn(`Warning: timeout value ${timeout} exceeds maximum value of ${MAX_TIMEOUT}ms`);
  }

  if (typeof host !== 'string' || host.length === 0) {
    throw new Error(`Invalid host: ${host}. Must be a non-empty string`);
  }

  if (typeof port !== 'number' || port < 1 || port > MAX_PORT || !Number.isInteger(port)) {
    throw new Error(`Invalid port: ${port}. Must be an integer between 1 and 65535`);
  }

  if (!isZeroOrOne(insecure)) {
    throw new Error(`Invalid insecure: ${insecure}. Must be 0 or 1`);
  }

  if (!isZeroOrOne(wsOrigin)) {
    throw new Error(`Invalid wsOrigin: ${wsOrigin}. Must be 0 or 1`);
  }

  if (
    app_id !== undefined &&
    (typeof app_id !== 'number' || app_id < 1 || !Number.isInteger(app_id))
  ) {
    throw new Error(`Invalid app_id: ${app_id}. Must be a positive integer`);
  }

  if (staging !== undefined && typeof staging !== 'boolean') {
    throw new Error(`Invalid staging: ${staging}. Must be a boolean`);
  }

  if (endpoints !== undefined) {
    if (!Array.isArray(endpoints)) {
      throw new Error(`Invalid endpoints: ${endpoints}. Must be an array of strings`);
    }
    if (!endpoints.every((e) => typeof e === 'string')) {
      throw new Error(`Invalid endpoints: ${endpoints}. All elements must be strings`);
    }
  }

  return settings;
}

function isZeroOrOne(value: unknown): value is 0 | 1 {
  return value === 0 || value === 1;
}
