import Link from "next/link";
import {
  Sparkles,
  Shield,
  Coins,
  Megaphone,
  Play,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">AdPromo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200">
              <Shield className="h-4 w-4" />
              Legitimate promotions only — no artificial traffic
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Promote your links with{" "}
              <span className="text-indigo-600">real engagement</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              AdPromo is a fair platform where users publish clearly labeled
              promotions, earn coins through legitimate activities, and discover
              content through the Runner — never through bots or fake clicks.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            {[
              {
                icon: Megaphone,
                title: "Publish Promotions",
                desc: "Submit your URL with a clear title and description. Spend coins to reach real viewers.",
              },
              {
                icon: Play,
                title: "Runner Sessions",
                desc: "View labeled promotions one at a time. Earn coins for completing legitimate view sessions.",
              },
              {
                icon: Coins,
                title: "Fair Coin Economy",
                desc: "Earn through daily logins, tasks, and referrals. Transparent pricing configured by admins.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 p-6 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        AdPromo — All promotions are clearly labeled. No artificial ad traffic.
      </footer>
    </div>
  );
}
