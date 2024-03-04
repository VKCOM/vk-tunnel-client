import { OAUTH_HOST, TUNNEL_APP_ID } from '../constants';

interface FetchAccessTokenResponse {
  error?: string;
  error_description?: string;
  user_id?: number;
  access_token?: string;
}

interface FetchAccessTokenRequest {
  deviceId: string;
}

export async function fetchUserData({ deviceId }: FetchAccessTokenRequest) {
  const userData = await fetch(
    `${OAUTH_HOST}code_auth_token?device_id=${deviceId}&client_id=${TUNNEL_APP_ID}`,
  );

  return (await userData.json()) as FetchAccessTokenResponse;
}
