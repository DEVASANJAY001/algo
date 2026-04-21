import { useState, useEffect, useRef, useCallback } from "react";
import type { OptionContract } from "@/types/scanner";

export interface VolumeDelta {
    symbol: string;
    strike: number;
    type: "CE" | "PE";
    buyVolume: number;
    sellVolume: number;
    totalVolume: number;
    lastLTP: number;
}

export type Timeframe = "5s" | "10s" | "30s" | "1m" | "5m" | "15m" | "30m" | "1h" | "2h" | "3h" | "4h" | "5h" | "6h" | "7h" | "8h";

const TIMEFRAME_MAP: Record<Timeframe, number> = {
    "5s": 5,
    "10s": 10,
    "30s": 30,
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "2h": 7200,
    "3h": 10800,
    "4h": 14400,
    "5h": 18000,
    "6h": 21600,
    "7h": 25200,
    "8h": 28800,
};

interface Snapshot {
    timestamp: number;
    contracts: Record<string, { volume: number; ltp: number; bid: number; ask: number }>;
}

export function useVolumeHistory(contracts: OptionContract[]) {
    const [history, setHistory] = useState<Snapshot[]>([]);
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (contracts.length === 0) return;

        const now = Date.now();
        // Only snapshot once per second (polling interval)
        if (now - lastUpdateRef.current < 900) return;
        lastUpdateRef.current = now;

        const snapshot: Snapshot = {
            timestamp: now,
            contracts: {},
        };

        contracts.forEach((c) => {
            snapshot.contracts[c.trading_symbol] = {
                volume: c.volume,
                ltp: c.ltp,
                bid: c.best_bid || 0,
                ask: c.best_ask || 0,
            };
        });

        setHistory((prev) => {
            const next = [...prev, snapshot];
            // Keep only up to 8 hours of history (28800 seconds)
            const eightHoursAgo = now - 8 * 60 * 60 * 1000;
            return next.filter((s) => s.timestamp >= eightHoursAgo);
        });
    }, [contracts]);

    const getDeltas = useCallback((timeframe: Timeframe): VolumeDelta[] => {
        if (history.length < 2) return [];

        const now = Date.now();
        const targetTime = now - TIMEFRAME_MAP[timeframe] * 1000;

        // Find the closest snapshot to targetTime
        const startSnapshot = history.find((s) => s.timestamp >= targetTime) || history[0];
        const endSnapshot = history[history.length - 1];

        if (!startSnapshot || !endSnapshot || startSnapshot === endSnapshot) return [];

        const startIndex = history.indexOf(startSnapshot);
        if (startIndex === -1) return [];

        return contracts.map((c) => {
            const start = startSnapshot.contracts[c.trading_symbol];
            const end = endSnapshot.contracts[c.trading_symbol];

            if (!start || !end) {
                return {
                    symbol: c.trading_symbol,
                    strike: c.strike,
                    type: c.option_type,
                    buyVolume: 0,
                    sellVolume: 0,
                    totalVolume: 0,
                    lastLTP: c.ltp,
                };
            }

            let buyVol = 0;
            let sellVol = 0;

            for (let i = startIndex + 1; i < history.length; i++) {
                const prev = history[i - 1]?.contracts[c.trading_symbol];
                const curr = history[i]?.contracts[c.trading_symbol];

                if (prev && curr) {
                    const delta = curr.volume - prev.volume;
                    if (delta > 0) {
                        let isBuy = true;
                        if (curr.bid > 0 && curr.ask > 0) {
                            const mid = (curr.bid + curr.ask) / 2;
                            isBuy = curr.ltp >= mid;
                        } else if (curr.ltp !== prev.ltp) {
                            isBuy = curr.ltp > prev.ltp;
                        } else {
                            isBuy = buyVol >= sellVol;
                        }

                        if (isBuy) {
                            buyVol += delta;
                        } else {
                            sellVol += delta;
                        }
                    }
                }
            }

            return {
                symbol: c.trading_symbol,
                strike: c.strike,
                type: c.option_type,
                buyVolume: buyVol,
                sellVolume: sellVol,
                totalVolume: buyVol + sellVol,
                lastLTP: c.ltp,
            };
        });
    }, [history, contracts]);

    return { getDeltas };
}
