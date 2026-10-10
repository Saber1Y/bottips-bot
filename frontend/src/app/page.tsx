import Link from "next/link";
import { ArrowRight, PencilLine, Share2, Wallet } from "lucide-react";
import { Card } from "@/components/ui";
import { PRODUCT } from "@/lib/product";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="pt-10 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Your creator tip jar. <span className="text-accent-500">Powered by BOT Chain.</span>
          </h1>
          <p className="mt-6 text-balance text-lg text-muted">
            Share one link. Get direct on-chain tips from your supporters. No invoices, no middleman.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-3 text-sm font-medium text-ink-950 transition-colors hover:bg-accent-400"
            >
              Get your tip link
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-850 px-5 py-3 text-sm font-medium transition-colors hover:border-ink-600"
            >
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your tip page",
                body: "Connect your wallet, pick a username and add a short bio.",
                icon: PencilLine,
              },
              {
                step: "02",
                title: "Share your link",
                body: "Send your /c/[username] link to your audience.",
                icon: Share2,
              },
              {
                step: "03",
                title: "Receive tips",
                body: "Supporters tip you directly in BOT with optional messages.",
                icon: Wallet,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.step} className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-sm text-accent-500">{s.step}</span>
                    <Icon className="size-4 text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
