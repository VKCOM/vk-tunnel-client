import { HttpProtocol, UserProxyAppSettings, WsProtocol } from './types';

export const USER_STORAGE_NAME = '@vkontakte/vk-tunnel';

export const USER_SETTINGS_FILE_NAME = 'vk-tunnel-config.json';

export const DEFAULT_USER_PROXY_APP_SETTINGS = {
  httpProtocol: process.env.PROXY_HTTP_PROTO ?? HttpProtocol.HTTP,
  wsProtocol: process.env.PROXY_WS_PROTO ?? WsProtocol.WS,
  timeout: Number(process.env.PROXY_TIMEOUT ?? 5000),
  port: Number(process.env.PROXY_PORT ?? 10888),
  host: process.env.PROXY_HOST ?? 'localhost',
  app_id: undefined,
  staging: undefined,
  endpoints: undefined,
} as UserProxyAppSettings;

export const OAUTH_HOST = 'https://oauth.vk.com/';
export const API_HOST = 'https://api.vk.com/method/';
export const API_VERSION = '5.199';
export const OAUTH_USER_REVOKE_TOKEN_ERROR = 5;
export const TUNNEL_APP_ID = 7357112;
