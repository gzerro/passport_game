import { BetSide } from '../types/game';

export interface PlayerInfoResponse {
  id?: number | string;
  balance?: number;
  currency?: string;
}

export interface BetCreatePayload {
  cid: string;
  sessionToken: string;
  playerId: string;
  productId: string;
  txId: string;
  betId: string;
  roundId: string;
  market: string;
  outcome: string;
  odds: number;
  amount: number;
  currency: string;
  specifier: string;
  customPayload?: string;
  timestamp: number;
}

export interface BetSettlePayload extends BetCreatePayload {
  amount: number;
}

export interface BetCancelPayload {
  cid: string;
  sessionToken: string;
  playerId: string;
  productId: string;
  txId: string;
  betId: string;
  timestamp: number;
}

export interface BetRollbackPayload extends BetCancelPayload {
  roundId: string;
  targetTxId: string;
}

interface ProviderApiClientOptions {
  baseUrl: string;
}

const sideOutcomeMap: Record<BetSide, '1' | '2'> = {
  yes: '1',
  no: '2',
};

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

const buildUrl = (baseUrl: string, path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (normalizedBaseUrl.length === 0) {
    return normalizedPath;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
};

const postJson = async <TResponse,>(baseUrl: string, path: string, body: unknown): Promise<TResponse> => {
  const response = await fetch(buildUrl(baseUrl, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Provider API request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
};

export const getOutcomeValue = (side: BetSide): '1' | '2' => sideOutcomeMap[side];

export const getRoundExternalId = (productId: string, roundId: number): string =>
  `${productId}-${roundId}`;

export const getBetExternalId = (productId: string, roundId: number): string =>
  `${productId}-${roundId}-bet`;

export const getTxId = (productId: string, roundId: number, operation: 'create' | 'settle' | 'cancel' | 'rollback'): string =>
  `${productId}-${roundId}-${operation}`;

export const createProviderApiClient = ({ baseUrl }: ProviderApiClientOptions) => ({
  playerInfo: (sessionToken: string): Promise<PlayerInfoResponse> =>
    postJson<PlayerInfoResponse>(baseUrl, '/api/player/info', { sessionToken }),

  createBet: (payload: BetCreatePayload): Promise<unknown> =>
    postJson<unknown>(baseUrl, '/api/bet/create', payload),

  settleBet: (payload: BetSettlePayload): Promise<unknown> =>
    postJson<unknown>(baseUrl, '/api/bet/settle', payload),

  cancelBet: (payload: BetCancelPayload): Promise<unknown> =>
    postJson<unknown>(baseUrl, '/api/bet/cancel', payload),

  rollbackBet: (payload: BetRollbackPayload): Promise<unknown> =>
    postJson<unknown>(baseUrl, '/api/bet/rollback', payload),
});
