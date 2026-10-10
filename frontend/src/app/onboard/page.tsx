"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { getNetwork } from "@/config/contracts";
import { payAbi } from "@/lib/abi/contractAbi";
import { copy } from "@/lib/utils";

type Profile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export default function OnboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    try {
      const key = "bottips:profiles:v2";
      const raw = localStorage.getItem(key);
      const map = raw ? (JSON.parse(raw) as Record<string, any>) : {};
      const existing = map[address.toLowerCase()];
      if (existing) {
        setProfile(existing);
        setSaved(true);
      }
    } catch {}
  }, [isConnected, address]);

  const canSave = isConnected && username.trim().length > 1;

  async function saveProfile() {
    if (!canSave || !address) return;
    const uname = slugify(username);
    try {
      const contracts = getNetwork(chainId);
      await writeContractAsync({
        address: contracts.contract as `0x${string}`,
        abi: payAbi,
        functionName: "register",
        args: [uname, displayName.trim() || uname, bio.trim()],
      });
      const p: Profile & { address: string } = {
        username: uname,
        displayName: displayName.trim() || uname,
        bio: bio.trim(),
        avatar: avatar.trim(),
        address,
      };
      try {
        const key = "bottips:profiles:v2";
        const raw = localStorage.getItem(key);
        const map = raw ? (JSON.parse(raw) as Record<string, any>) : {};
        map[address.toLowerCase()] = p;
        localStorage.setItem(key, JSON.stringify(map));
        const ukey = "bottips:by-username";
        const uraw = localStorage.getItem(ukey);
        const umap = uraw ? (JSON.parse(uraw) as Record<string, any>) : {};
        umap[uname] = p;
        localStorage.setItem(ukey, JSON.stringify(umap));
      } catch {}
      setProfile(p);
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  }

  const link = profile ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${profile.username}` : "";

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <p className="text-sm text-accent-400">Create your tip page</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Set up your creator tip jar</h1>
        <p className="mt-2 text-sm text-muted">
          Connect your wallet, choose a username, add a short bio. Share your /c/[username] link with supporters.
        </p>
      </div>

      {!isConnected && (
        <Card className="p-6 text-sm text-muted">Connect your wallet to get started.</Card>
      )}

      {isConnected && !saved && (
        <Card className="space-y-6 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet</label>
            <Input value={address ?? ""} readOnly disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input placeholder="saber" value={username} onChange={(e) => setUsername(e.target.value)} />
            <p className="text-xs text-muted">Your shareable link will be /c/{slugify(username) || "username"}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Display name</label>
            <Input placeholder="Saber" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea rows={3} placeholder="Building in public. Tips appreciated." value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Avatar URL (optional)</label>
            <Input placeholder="https://..." value={avatar} onChange={(e) => setAvatar(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={!canSave}>
              Save tip page
            </Button>
          </div>
        </Card>
      )}

      {saved && profile && (
        <Card className="space-y-6 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-accent-400" />
          <div>
            <h2 className="text-xl font-semibold">Your tip page is ready</h2>
            <p className="mt-2 text-sm text-muted">Share this link with your supporters.</p>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-ink-850 px-4 py-2.5 font-mono text-sm">
            <span className="truncate text-left">{link}</span>
            <button className="text-sm text-accent-400 hover:text-accent-300" onClick={() => copy(link)}>
              Copy
            </button>
          </div>
          <div className="flex justify-center gap-3">
            <Link href={`/c/${profile.username}`} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-400">
              View your tip page <ArrowRight className="size-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-850 px-4 py-2 text-sm font-medium hover:border-ink-600">
              Go to dashboard
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
