"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useChainId, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { ArrowRight, Send, CheckCircle2 } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { botTestnet, botMainnet } from "@/config/chains";

type Profile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  address: string;
};

const SUGGESTED = ["1", "5", "10", "25"];

function explorerTx(chainId?: number, hash?: string) {
  if (chainId === 968) return `https://bohrscan.com/tx/${hash}`;
  if (chainId === 677) return `https://scan.botchain.ai/tx/${hash}`;
  return `https://bohrscan.com/tx/${hash}`;
}

export default function TipPage() {
  const params = useParams<{ username: string }>();
  const username = params?.username as string;
  const { address: myAddr, isConnected } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync, isPending } = useSendTransaction();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [amount, setAmount] = useState("5");
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const key = "bottips:profiles";
      const raw = localStorage.getItem(key);
      const map = raw ? (JSON.parse(raw) as Record<string, Profile & { address: string }>) : {};
      const p = map[username];
      if (p) setProfile(p);
    } catch {}
  }, [username]);

  const activeAmount = custom.trim() ? custom.trim() : amount;
  const isValid = profile && parseFloat(activeAmount) > 0;

  async function sendTip() {
    if (!isValid || !profile) return;
    setErr(null);
    try {
      const value = parseEther(activeAmount);
      const hash = await sendTransactionAsync({
        to: profile.address as `0x${string}`,
        value,
      });
      setTxHash(hash);
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || "Failed to send tip");
    }
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold">Tip page not found</h1>
          <p className="mt-2 text-sm text-muted">This username hasn’t set up a tip page yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.displayName} className="size-16 rounded-full border border-line object-cover" />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-accent-500/20 font-semibold text-accent-400">{profile.displayName[0]?.toUpperCase()}</div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
          <p className="mt-1 text-sm text-muted">@{profile.username}</p>
        </div>
        {profile.bio && <p className="max-w-xl text-sm text-muted">{profile.bio}</p>}
      </div>

      {!sent && (
        <Card className="space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold">Send a tip</h2>
            <p className="mt-1 text-sm text-muted">Choose an amount. Tips go straight to {profile.displayName}'s wallet on BOT Chain.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((v) => (
              <button
                key={v}
                onClick={() => {
                  setCustom("");
                  setAmount(v);
                }}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${(!custom && amount === v) ? "border-accent-500/60 bg-accent-500/10 text-accent-300" : "border-line bg-ink-850 text-muted hover:border-ink-600 hover:text-white"}`}
              >
                {v} BOT
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom amount (BOT)</label>
            <Input placeholder="e.g. 2.5" value={custom} onChange={(e) => setCustom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message (optional)</label>
            <Textarea rows={3} placeholder="Thanks for building!" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} />
            <p className="text-right text-xs text-muted">{message.length}/200</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">Tip amount: <span className="font-medium text-white">{activeAmount} BOT</span></div>
            <Button onClick={sendTip} disabled={!isConnected || isPending || !isValid}>
              <Send className="size-4" /> Send tip
            </Button>
          </div>
          {err && <p className="text-sm text-danger-400">{err}</p>}
          {!isConnected && <p className="text-sm text-muted">Connect your wallet to send a tip.</p>}
        </Card>
      )}

      {sent && txHash && (
        <Card className="space-y-6 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-accent-400" />
          <div>
            <h2 className="text-xl font-semibold">Tip sent</h2>
            <p className="mt-2 text-sm text-muted">Your tip of {activeAmount} BOT was sent on-chain.</p>
          </div>
          <a href={explorerTx(chainId, txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300">
            View transaction on explorer <ArrowRight className="size-4" />
          </a>
        </Card>
      )}
    </div>
  );
}
