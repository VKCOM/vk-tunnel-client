import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry, { isNetworkOrIdempotentRequestError } from 'axios-retry';
import {
  TUNNEL_DATA_REQUEST_RETRIES_LIMIT,
  TUNNEL_DATA_REQUEST_RETRY_DELAY_MS,
} from '../constants';

const axiosInstance: AxiosInstance = axios.create();

axiosRetry(axiosInstance, {
  retries: TUNNEL_DATA_REQUEST_RETRIES_LIMIT,
  retryDelay: () => TUNNEL_DATA_REQUEST_RETRY_DELAY_MS,
  retryCondition: (error) => {
    return isNetworkOrIdempotentRequestError(error);
  },
});

export interface AxiosWithRetryRequest {
  url: string;
  options: AxiosRequestConfig;
  onError: (error: unknown) => void;
}

export async function axiosWithRetry({
  url,
  options,
  onError,
}: AxiosWithRetryRequest): Promise<any> {
  try {
    return await axiosInstance(url, options);
  } catch (error) {
    onError(error);
    throw error;
  }
}
