import Configstore from 'configstore';
import chalk from 'chalk';
import prompt from 'prompts';
import { fetchAuthData, fetchUserData, fetchTunnelData } from '../api';
import { TunnelConnectionData, UserData, UserProxyAppSettings } from '../types';
import {
  OAUTH_HOST,
  API_VERSION,
  USER_STORAGE_NAME,
  OAUTH_USER_REVOKE_TOKEN_ERROR,
} from '../constants';

async function auth() {
  const authData = await fetchAuthData();

  if ('error' in authData && 'error_description' in authData) {
    throw new Error(`Failed auth code ${authData.error} ${authData.error_description}`);
  }

  return await confirmAuth(authData.auth_code, authData.device_id);
}

async function confirmAuth(authCode: string, deviceId: string): Promise<UserData> {
  const confirmAuthLink = `${OAUTH_HOST}code_auth?stage=check&code=${authCode}`;

  const promptQuestion = await prompt({
    type: 'confirm',
    name: 'result',
    initial: true,
    message: chalk.yellow('Please open and approve authentication ', confirmAuthLink),
  });

  if (!promptQuestion.result) {
    throw new Error(`Empty auth response ${promptQuestion.result}`);
  }

  const fetchUserDataResponse = await fetchUserData({ deviceId });

  if ('error' in fetchUserDataResponse && 'error_description' in fetchUserDataResponse) {
    return await confirmAuth(authCode, deviceId);
  }

  return {
    accessToken: fetchUserDataResponse.access_token,
    userId: fetchUserDataResponse.user_id,
  };
}

export async function getTunnelConnectionData(
  userSettings: UserProxyAppSettings,
): Promise<TunnelConnectionData> {
  const userStoredInfo = new Configstore(USER_STORAGE_NAME, {});

  if (!userStoredInfo.get('accessToken') || !userStoredInfo.get('userId')) {
    const { accessToken, userId } = await auth();
    userStoredInfo.set('accessToken', accessToken);
    userStoredInfo.set('userId', userId);
  }

  const tunnelData = await fetchTunnelData({
    access_token: userStoredInfo.get('accessToken'),
    version: 1,
    v: API_VERSION,
    app_id: userSettings.app_id,
    staging: userSettings.staging,
    endpoints: userSettings.endpoints,
  });

  if (!('response' in tunnelData)) {
    if (tunnelData.error.error_code === OAUTH_USER_REVOKE_TOKEN_ERROR) {
      userStoredInfo.delete('accessToken');
      userStoredInfo.delete('userId');
      console.log('Previous settings has been removed. Try again.');
      return await getTunnelConnectionData(userSettings);
    }

    throw new Error(
      `Failed to fetch tunnel configuration from server. Error description: ${tunnelData.error.error_msg}`,
    );
  }

  return {
    tunnelToken: tunnelData.response.token,
    tunnelHost: tunnelData.response.host,
    tunnelUrl: tunnelData.response.tunnel_url,
    url: tunnelData.response.url,
    userId: userStoredInfo.get('userId'),
  };
}
