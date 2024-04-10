import querystring from 'node:querystring';
import fetch from 'node-fetch';
import { API_HOST } from '../constants';

interface VkApiError {
  error: {
    error_code: number;
    error_msg: string;
  };
}

interface FetchTunnelDataResponse {
  response: {
    tunnel_url: string;
    token: string;
    host: string;
    url: string;
  };
}

interface FetchTunnelDataRequest {
  access_token: string;
  version: number;
  v: string;
  app_id?: number;
  staging?: boolean;
  endpoints?: string[];
}

export async function fetchTunnelData({
  access_token,
  version,
  v,
  app_id,
  staging,
  endpoints,
}: FetchTunnelDataRequest) {
  const params: Record<string, string | number | boolean> = { access_token, version, v };

  if (app_id) params['app_id'] = app_id;
  if (staging) params['staging'] = staging;
  if (endpoints) params['endpoints'] = endpoints.join(',');

  try {
    const tunnelDataJson = await fetch(
      `${API_HOST}apps.getTunnelToken?${querystring.stringify(params)}`,
    );

    return (await tunnelDataJson.json()) as FetchTunnelDataResponse | VkApiError;
  } catch (error) {
    console.log('An error occurred when requesting tunnel settings', error);
    throw error;
  }
}
