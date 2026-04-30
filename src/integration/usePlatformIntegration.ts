import { useEffect, useMemo, useRef, useState } from 'react';
import { HistoryEntry, StageIndicator, BetSide } from '../types/game';
import { LaunchParams, readLaunchParams } from './launchParams';
import {
  BetCreatePayload,
  createProviderApiClient,
  getBetExternalId,
  getOutcomeValue,
  getRoundExternalId,
  getTxId,
} from './providerApi';

interface UsePlatformIntegrationParams {
  stage: StageIndicator;
  roundId: number;
  selectedSide: BetSide | null;
  currentBet: number;
  coefficients: Record<BetSide, number>;
  currentRoundEntry: HistoryEntry | null;
}

interface PlatformIntegrationState {
  launchParams: LaunchParams;
  isIntegratedLaunch: boolean;
  playerId: string | null;
}

const getUnixTimestamp = (): number => Math.floor(Date.now() / 1000);

const buildBetPayload = ({
  launchParams,
  playerId,
  roundId,
  side,
  amount,
  odds,
  operation,
}: {
  launchParams: LaunchParams;
  playerId: string;
  roundId: number;
  side: BetSide;
  amount: number;
  odds: number;
  operation: 'create' | 'settle';
}): BetCreatePayload => {
  const payload: BetCreatePayload = {
    cid: launchParams.cid,
    sessionToken: launchParams.sessionToken ?? '',
    playerId,
    productId: launchParams.productId,
    txId: getTxId(launchParams.productId, roundId, operation),
    betId: getBetExternalId(launchParams.productId, roundId),
    roundId: getRoundExternalId(launchParams.productId, roundId),
    market: 'BINARY',
    outcome: getOutcomeValue(side),
    odds,
    amount,
    currency: launchParams.currency,
    specifier: 'passport',
    timestamp: getUnixTimestamp(),
  };

  if (launchParams.customPayload) {
    payload.customPayload = launchParams.customPayload;
  }

  return payload;
};

export const usePlatformIntegration = ({
  stage,
  roundId,
  selectedSide,
  currentBet,
  coefficients,
  currentRoundEntry,
}: UsePlatformIntegrationParams): PlatformIntegrationState => {
  const launchParams = useMemo(() => readLaunchParams(), []);
  const client = useMemo(
    () => createProviderApiClient({ baseUrl: launchParams.providerApiBaseUrl }),
    [launchParams.providerApiBaseUrl],
  );
  const [playerId, setPlayerId] = useState<string | null>(launchParams.playerId);
  const sentCreateRoundIdsRef = useRef<Set<number>>(new Set());
  const sentSettleRoundIdsRef = useRef<Set<number>>(new Set());

  const isIntegratedLaunch = launchParams.sessionToken !== null;

  useEffect(() => {
    if (!launchParams.sessionToken) {
      return;
    }

    let isCancelled = false;

    void client.playerInfo(launchParams.sessionToken)
      .then((playerInfo) => {
        if (isCancelled || playerInfo.id === undefined) {
          return;
        }

        setPlayerId(String(playerInfo.id));
      })
      .catch((error: unknown) => {
        console.warn('Platform player/info failed', error);
      });

    return () => {
      isCancelled = true;
    };
  }, [client, launchParams.sessionToken]);

  useEffect(() => {
    if (
      !launchParams.sessionToken ||
      !playerId ||
      stage !== 'resolving' ||
      selectedSide === null ||
      currentBet <= 0 ||
      sentCreateRoundIdsRef.current.has(roundId)
    ) {
      return;
    }

    sentCreateRoundIdsRef.current.add(roundId);

    void client.createBet(
      buildBetPayload({
        launchParams,
        playerId,
        roundId,
        side: selectedSide,
        amount: currentBet,
        odds: coefficients[selectedSide],
        operation: 'create',
      }),
    ).catch((error: unknown) => {
      console.warn('Platform bet/create failed', error);
    });
  }, [client, coefficients, currentBet, launchParams, playerId, roundId, selectedSide, stage]);

  useEffect(() => {
    if (
      !launchParams.sessionToken ||
      !playerId ||
      stage !== 'finished' ||
      !currentRoundEntry ||
      sentSettleRoundIdsRef.current.has(currentRoundEntry.roundId)
    ) {
      return;
    }

    sentSettleRoundIdsRef.current.add(currentRoundEntry.roundId);

    void client.settleBet(
      buildBetPayload({
        launchParams,
        playerId,
        roundId: currentRoundEntry.roundId,
        side: currentRoundEntry.roundResult,
        amount: currentRoundEntry.payout,
        odds: currentRoundEntry.coefficient,
        operation: 'settle',
      }),
    ).catch((error: unknown) => {
      console.warn('Platform bet/settle failed', error);
    });
  }, [client, currentRoundEntry, launchParams, playerId, stage]);

  return {
    launchParams,
    isIntegratedLaunch,
    playerId,
  };
};
