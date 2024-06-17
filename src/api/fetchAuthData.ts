import { OAUTH_HOST, TUNNEL_APP_ID } from '../constants';
import { VkAuthError } from '../types';
import { axiosWithRetry } from './axiosWithRetry';

interface FetchAuthDataResponse {
  auth_code: string;
  device_id: string;
}

export async function fetchAuthData() {
  const authData = await axiosWithRetry({
    url: `${OAUTH_HOST}get_auth_code?scope=offline&client_id=${TUNNEL_APP_ID}`,
    options: {},
    onError: (error) =>
      console.error('An error occurred when requesting authentication data:', error),
  });

  return authData.data as FetchAuthDataResponse | VkAuthError;
}
