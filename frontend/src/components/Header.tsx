import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { PRODUCT } from "@/lib/product";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BotTips logo" className="size-7 rounded-md" />
            <img src="/wordmark.png" alt="BotTips wordmark" className="h-5" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
            <Link href="/onboard" className="transition-colors hover:text-white">
              Create tip page
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">
              Dashboard
            </Link>
          </nav>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}