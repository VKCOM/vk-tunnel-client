import WebsocketClient from 'ws';
import { TunnelClient } from './entities';
import { getTunnelConnectionData, getUserProxyAppSettings } from './helpers';

export async function vkTunnel() {
  const userSettings = getUserProxyAppSettings(process.argv.slice(2));
  const tunnelData = await getTunnelConnectionData(userSettings);

  const vkProxyServerUrl = `${tunnelData.tunnelHost}/${tunnelData.url}`;

  const socket = new WebsocketClient(vkProxyServerUrl, {
    headers: {
      UserID: String(tunnelData.userId),
      Token: tunnelData.tunnelToken,
    },
  });

  const tunnelClient = new TunnelClient(socket, tunnelData, userSettings);

  await new Promise<void>((resolve, reject) => {
    socket.on('open', () => {
      tunnelClient.onConnectionOpen();
      resolve();
    });
    socket.on('error', (err: string) => {
      tunnelClient.onConnectionError(err);
      reject(err);
    });
    socket.on('close', (code) => {
      reject(new Error(`Closed before open, code: ${code}`));
    });
  });

  socket.on('message', (data) => void tunnelClient.onMessage(data));

  return {
    tunnelData,
    closeTunnelConnection: () => socket.close(),
  };
}
