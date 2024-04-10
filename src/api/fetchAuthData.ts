import fetch from 'node-fetch';
import { OAUTH_HOST, TUNNEL_APP_ID } from '../constants';
import { VkAuthError } from '../types';

interface FetchAuthDataResponse {
  auth_code: string;
  device_id: string;
}

export async function fetchAuthData() {
  try {
    const authDataJson = await fetch(
      `${OAUTH_HOST}get_auth_code?scope=offline&client_id=${TUNNEL_APP_ID}`,
    );

    return (await authDataJson.json()) as FetchAuthDataResponse | VkAuthError;
  } catch (error) {
    console.error('An error occurred when requesting authentication data:', error);
    throw error;
  }
}
