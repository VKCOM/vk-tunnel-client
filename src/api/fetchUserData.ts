import fetch from 'node-fetch';
import { OAUTH_HOST, TUNNEL_APP_ID } from '../constants';
import { VkAuthError } from '../types';

interface FetchAccessTokenResponse {
  user_id: number;
  access_token: string;
}

interface FetchAccessTokenRequest {
  deviceId: string;
}

export async function fetchUserData({ deviceId }: FetchAccessTokenRequest) {
  try {
    const userData = await fetch(
      `${OAUTH_HOST}code_auth_token?device_id=${deviceId}&client_id=${TUNNEL_APP_ID}`,
    );

    return (await userData.json()) as FetchAccessTokenResponse | VkAuthError;
  } catch (error) {
    console.log('An error occurred when requesting user data', error);
    throw error;
  }
}
