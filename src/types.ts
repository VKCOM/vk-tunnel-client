export enum HttpProtocol {
  HTTP = 'http',
  HTTPS = 'https',
}

export enum WsProtocol {
  WS = 'ws',
  WSS = 'wss',
}

export enum MessageTypeToSend {
  HTTP = '\0',
  WEBSOCKET = '\x01',
}

export enum MessageTypeFromBack {
  HTTP = '\0',
  WEBSOCKET_BINARY = '\x02',
  WEBSOCKET_TEXT = '\x01',
  WEBSOCKET_CLOSE = '\b',
}

export interface ParseRequestResult {
  method: string;
  uri: string;
  headers: { [key: string]: string | string[] };
  body: string;
}

export interface UserProxyAppSettings {
  httpProtocol: HttpProtocol;
  wsProtocol: WsProtocol;
  timeout: number;
  host: string;
  port: number;
  insecure: 0 | 1;
  wsOrigin: 0 | 1;
  app_id?: number;
  staging?: boolean;
  endpoints?: string[];
}

export interface UserProxyAppSettingsArgs
  extends Omit<UserProxyAppSettings, 'httpProtocol' | 'wsProtocol' | 'wsOrigin'> {
  'http-protocol': HttpProtocol;
  'ws-protocol': WsProtocol;
  'ws-origin': 0 | 1;
}

export interface TunnelConnectionData {
  tunnelHost: string;
  tunnelUrl: string;
  tunnelToken: string;
  url: string;
  userId: number;
}

export interface UserData {
  accessToken: string;
  userId: number;
}

export interface ProxiedNetworkPacket {
  seq: string;
  payload: ArrayBuffer | Buffer[] | string | Buffer;
  endpoint: string;
  messageType: MessageTypeFromBack;
  isWebsocketUpgrade: boolean;
  parsedRequest: ParseRequestResult;
}

export type SendResponseToProxyServer = (
  data: Buffer | string,
  callback?: (error?: Error) => void,
) => void;

export interface VkAuthError {
  error: string;
  error_description: string;
}
