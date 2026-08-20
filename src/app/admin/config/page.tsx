"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner, SuccessMessage } from "@/components/ui/states";

interface ConfigItem {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
}

export default function AdminConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [rewards, setRewards] = useState({
    daily_login: 10,
    referral: 50,
    runner_view: 5,
    platform_task: 25,
  });
  const [pricing, setPricing] = useState({ coins_per_100_impressions: 500 });
  const [cooldowns, setCooldowns] = useState({
    free_minutes: 30,
    tier1_minutes: 15,
    tier2_minutes: 0,
  });
  const [runner, setRunner] = useState({ view_seconds: 20, min_view_seconds: 15 });

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d) => {
        d.config?.forEach((item: ConfigItem) => {
          if (item.key === "coin_rewards") setRewards(item.value as typeof rewards);
          if (item.key === "campaign_pricing") setPricing(item.value as typeof pricing);
          if (item.key === "cooldowns") setCooldowns(item.value as typeof cooldowns);
          if (item.key === "runner") setRunner(item.value as typeof runner);
        });
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    setSuccess("");
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coin_rewards: rewards,
        campaign_pricing: pricing,
        cooldowns,
        runner,
      }),
    });
    setSaving(false);
    if (res.ok) setSuccess("Configuration saved successfully.");
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Configuration</h1>
        <p className="text-slate-600">Configure coin rewards, pricing, and cooldowns.</p>
      </div>

      {success && <SuccessMessage message={success} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Coin Rewards">
          <div className="space-y-3">
            {Object.entries(rewards).map(([key, val]) => (
              <Input
                key={key}
                label={key.replace(/_/g, " ")}
                type="number"
                value={val}
                onChange={(e) =>
                  setRewards({ ...rewards, [key]: parseInt(e.target.value) || 0 })
                }
              />
            ))}
          </div>
        </Card>

        <Card title="Campaign Pricing">
          <Input
            label="Coins per 100 impressions"
            type="number"
            value={pricing.coins_per_100_impressions}
            onChange={(e) =>
              setPricing({
                coins_per_100_impressions: parseInt(e.target.value) || 500,
              })
            }
          />
        </Card>

        <Card title="Cooldown Periods (minutes)">
          <div className="space-y-3">
            <Input
              label="Free tier"
              type="number"
              value={cooldowns.free_minutes}
              onChange={(e) =>
                setCooldowns({ ...cooldowns, free_minutes: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Premium Tier 1"
              type="number"
              value={cooldowns.tier1_minutes}
              onChange={(e) =>
                setCooldowns({ ...cooldowns, tier1_minutes: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Premium Tier 2"
              type="number"
              value={cooldowns.tier2_minutes}
              onChange={(e) =>
                setCooldowns({ ...cooldowns, tier2_minutes: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </Card>

        <Card title="Runner Settings">
          <div className="space-y-3">
            <Input
              label="Required view seconds"
              type="number"
              value={runner.view_seconds}
              onChange={(e) =>
                setRunner({ ...runner, view_seconds: parseInt(e.target.value) || 20 })
              }
            />
            <Input
              label="Minimum view seconds"
              type="number"
              value={runner.min_view_seconds}
              onChange={(e) =>
                setRunner({ ...runner, min_view_seconds: parseInt(e.target.value) || 15 })
              }
            />
          </div>
        </Card>
      </div>

      <Button onClick={save} loading={saving}>
        Save Configuration
      </Button>
    </div>
  );
}
