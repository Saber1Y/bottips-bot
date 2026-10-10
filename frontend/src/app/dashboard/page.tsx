"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Card } from "@/components/ui";
import { formatAmount, formatTime } from "@/lib/format";
import { botTestnet } from "@/config/chains";

const EXPLORER_V2_TESTNET = "https://scan.bohr.life/api/v2";
const EXPLORER_V2_MAINNET = "https://scan.botchain.ai/api/v2";

type TipTx = {
  hash: string;
  from: string;
  value: string;
  valueWei: bigint;
  time: number;
  block: number;
};

function explorerApiBase(chainId?: number) {
  if (chainId === 968) return EXPLORER_V2_TESTNET;
  if (chainId === 677) return EXPLORER_V2_MAINNET;
  return EXPLORER_V2_TESTNET;
}

function explorerTx(chainId?: number, hash?: string) {
  if (chainId === 968) return `https://bohrscan.com/tx/${hash}`;
  if (chainId === 677) return `https://scan.botchain.ai/tx/${hash}`;
  return `https://bohrscan.com/tx/${hash}`;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [tips, setTips] = useState<TipTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    const api = explorerApiBase(chainId);
    setLoading(true);
    setError(null);
    fetch(`${api}/addresses/${address}/transactions?filter=to`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => {
        const items: any[] = data.items || [];
        const out: TipTx[] = items
          .map((it) => {
            const from = it.from?.hash || it.from?.address || "";
            const to = it.to?.hash || it.to?.address || "";
            if (to?.toLowerCase() !== address.toLowerCase()) return null;
            const valueStr = it.value || "0";
            let valueWei: bigint;
            try {
              valueWei = BigInt(valueStr);
            } catch {
              valueWei = BigInt(0);
            }
            const time = it.timestamp ? Math.floor(new Date(it.timestamp).getTime() / 1000) : 0;
            return { hash: it.hash, from, value: valueStr, valueWei, time, block: it.block_number || 0 } as TipTx;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.time - a.time)
          .slice(0, 50) as TipTx[];
        setTips(out);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isConnected, address, chainId]);

  const total = tips.reduce((sum, t) => sum + t.valueWei, BigInt(0));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-accent-400">Tips received</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your dashboard</h1>
        <p className="mt-2 text-sm text-muted">Tips sent to your connected wallet, verified via explorer.</p>
      </div>
      {!isConnected && <Card className="p-6 text-sm text-muted">Connect your wallet to view tips.</Card>}
      {isConnected && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-sm text-muted">Total received</div>
            <div className="mt-1 text-2xl font-semibold">{formatAmount(total, 18)} BOT</div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-ink-850/60 px-5 py-3 text-sm font-medium">Recent tips</div>
            {loading && <div className="p-5 text-sm text-muted">Loading...</div>}
            {error && <div className="p-5 text-sm text-danger-400">{error}</div>}
            {!loading && !error && tips.length === 0 && <div className="p-5 text-sm text-muted">No tips received yet.</div>}
            {tips.length > 0 && (
              <div className="divide-y divide-line">
                {tips.map((t) => (
                  <div key={t.hash} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="space-y-1">
                      <div className="font-mono text-xs text-muted">{t.from.slice(0, 10)}...{t.from.slice(-8)}</div>
                      <div className="text-xs text-muted">{t.time ? formatTime(BigInt(t.time)) : ""}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{formatAmount(t.valueWei, 18)} BOT</div>
                      <a href={explorerTx(chainId, t.hash)} target="_blank" rel="noreferrer" className="text-xs text-accent-400 hover:text-accent-300">
                        View tx
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
