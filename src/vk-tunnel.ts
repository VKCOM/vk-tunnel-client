#!/usr/bin/env node

import WebsocketClient from 'ws';
import { getTunnelConnectionData, getUserProxyAppSettings } from './helpers';
import { TunnelClient } from './entities';

async function vkTunnel() {
  const userSettings = getUserProxyAppSettings();
  const tunnelData = await getTunnelConnectionData(userSettings);

  const vkProxyServerUrl = `${tunnelData.tunnelHost}/${tunnelData.url}`;

  const socket = new WebsocketClient(vkProxyServerUrl, {
    headers: { UserID: String(tunnelData.userId), Token: tunnelData.tunnelToken },
  });

  const tunnelClient = new TunnelClient(socket, userSettings, tunnelData);

  socket.on('open', () => tunnelClient.onConnectionOpen());
  socket.on('close', (code: string) => tunnelClient.onConnectionClose(code));
  socket.on('error', (error: string) => tunnelClient.onConnectionError(error));
  socket.on('message', (data) => void tunnelClient.onMessage(data));
}

vkTunnel().catch((error) => console.log(error));
