import { OAUTH_HOST, TUNNEL_APP_ID } from '../constants';

interface FetchAuthDataResponse {
  error?: string;
  error_description?: string;
  auth_code?: string;
  device_id?: string;
}

export async function fetchAuthData() {
  const authDataJson = await fetch(
    `${OAUTH_HOST}get_auth_code?scope=offline&client_id=${TUNNEL_APP_ID}`,
  );

  return (await authDataJson.json()) as FetchAuthDataResponse;
}
