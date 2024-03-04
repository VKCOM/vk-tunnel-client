import { ParseRequestResult } from 'http-string-parser';

export enum HttpProtocol {
  HTTP = 'http',
  HTTPS = 'https',
}

export enum WsProtocol {
  WS = 'ws',
  WSS = 'wss',
}

export enum MessageType {
  HTTP = '\0',
  WEBSOCKET = '\x01',
  WEBSOCKET_CLOSE = '\b',
}

export interface UserProxyAppSettings {
  httpProtocol: HttpProtocol;
  wsProtocol: WsProtocol;
  timeout: number;
  host: string;
  port: number;
  app_id?: number;
  staging?: boolean;
  endpoints?: string[];
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
  payload: string;
  endpoint: string;
  messageType: MessageType;
  isWebsocketUpgrade: boolean;
  parsedRequest: ParseRequestResult;
}

export type SendResponseToProxyServer = (
  data: Buffer | string,
  callback?: (error?: Error) => void,
) => void;
