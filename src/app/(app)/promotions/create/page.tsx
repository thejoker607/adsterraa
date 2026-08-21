"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage, SuccessMessage } from "@/components/ui/states";
import { calculateCampaignCost } from "@/lib/utils";
import { Coins } from "lucide-react";
import { useOnAppRefresh } from "@/lib/app-refresh";

export default function CreatePromotionPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    targetImpressions: 100,
  });
  const [pricing, setPricing] = useState(500);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.campaign_pricing?.coins_per_100_impressions) {
          setPricing(d.config.campaign_pricing.coins_per_100_impressions);
        }
      });
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        if (d.balance !== undefined) setBalance(d.balance);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOnAppRefresh(load);

  const cost = calculateCampaignCost(form.targetImpressions, pricing);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(
      `Promotion submitted! ${data.coinCost} coins deducted. Awaiting admin approval.`
    );
    setForm({ title: "", description: "", url: "", targetImpressions: 100 });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Promotion</h1>
        <p className="text-slate-600">
          Submit your promotional URL. All promotions are clearly labeled as
          sponsored content.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="My Product Launch"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Brief description of your promotion..."
          />
          <Input
            label="Promotional URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
            placeholder="https://example.com"
          />
          <Input
            label="Target Impressions"
            type="number"
            min={100}
            max={100000}
            step={100}
            value={form.targetImpressions}
            onChange={(e) =>
              setForm({ ...form, targetImpressions: parseInt(e.target.value) || 100 })
            }
            required
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Estimated cost</span>
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                <Coins className="h-4 w-4" />
                {cost} coins
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-slate-500">Your balance</span>
              <span className={balance >= cost ? "text-emerald-600" : "text-red-600"}>
                {balance} coins
              </span>
            </div>
          </div>

          <Button type="submit" loading={loading} disabled={balance < cost} className="w-full">
            Publish Promotion ({cost} coins)
          </Button>
        </form>
      </Card>
    </div>
  );
}
