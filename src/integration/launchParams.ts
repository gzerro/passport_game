export interface LaunchParams {
  sessionToken: string | null;
  cid: string;
  playerId: string | null;
  productId: string;
  currency: string;
  customPayload: string | null;
  providerApiBaseUrl: string;
}

const getQueryValue = (params: URLSearchParams, keys: string[]): string | null => {
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

export const readLaunchParams = (): LaunchParams => {
  const envApiBaseUrl = import.meta.env.VITE_PROVIDER_API_BASE_URL ?? '';

  if (typeof window === 'undefined') {
    return {
      sessionToken: null,
      cid: 'ourPlatform',
      playerId: null,
      productId: 'passport',
      currency: 'RUB',
      customPayload: null,
      providerApiBaseUrl: envApiBaseUrl,
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    sessionToken: getQueryValue(params, ['sessionToken', 'token', 'session_token']),
    cid: getQueryValue(params, ['cid', 'platform', 'platformId']) ?? 'ourPlatform',
    playerId: getQueryValue(params, ['playerId', 'player_id', 'userId']),
    productId: getQueryValue(params, ['productId', 'gameId', 'product']) ?? 'passport',
    currency: getQueryValue(params, ['currency', 'cur']) ?? 'RUB',
    customPayload: getQueryValue(params, ['customPayload', 'payload']),
    providerApiBaseUrl: getQueryValue(params, ['providerApiBaseUrl', 'apiBaseUrl']) ?? envApiBaseUrl,
  };
};
