import { isAxiosError } from 'axios';
import { OAUTH_HOST, TUNNEL_APP_ID } from '../constants';
import { VkAuthError } from '../types';
import { axiosWithRetry } from './axiosWithRetry';

interface FetchAccessTokenResponse {
  user_id: number;
  access_token: string;
}

interface FetchAccessTokenRequest {
  deviceId: string;
}

export async function fetchUserData({ deviceId }: FetchAccessTokenRequest) {
  const userData = await axiosWithRetry({
    url: `${OAUTH_HOST}code_auth_token?device_id=${deviceId}&client_id=${TUNNEL_APP_ID}`,
    options: {},
    onError: (error) => {
      console.error('An error occurred when requesting user data');
      if (error && typeof error === 'object' && isAxiosError(error)) {
        console.error('Reason:', error.response?.data?.error_description);
      } else {
        console.error(error);
      }
    },
  });

  return userData.data as FetchAccessTokenResponse | VkAuthError;
}
