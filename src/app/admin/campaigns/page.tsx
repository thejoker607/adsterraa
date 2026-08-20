"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { statusBadge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/states";
import { ExternalLink } from "lucide-react";

interface Campaign {
  id: string;
  status: string;
  target_impressions: number;
  current_impressions: number;
  coin_cost: number;
  admin_notes: string | null;
  promotions: { title: string; url: string; description: string | null };
  profiles: { email: string; full_name: string | null };
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void load();
  }, []);

  async function handleAction(campaignId: string, action: string) {
    setActionLoading(true);
    await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, action }),
    });
    setActionLoading(false);
    load();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaign Review</h1>
        <p className="text-slate-400">Review and approve submitted promotions.</p>
      </div>

      <div className="space-y-4">
        {campaigns.map((c) => (
          <Card key={c.id} className="border-slate-700 bg-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{c.promotions.title}</h3>
                  {statusBadge(c.status)}
                </div>
                <p className="text-sm text-slate-400">
                  by {c.profiles.full_name || c.profiles.email}
                </p>
                {c.promotions.description && (
                  <p className="mt-1 text-sm text-slate-300">{c.promotions.description}</p>
                )}
                <a
                  href={c.promotions.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-400 hover:underline"
                >
                  {c.promotions.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="mt-2 text-sm text-slate-500">
                  {c.current_impressions}/{c.target_impressions} impressions · {c.coin_cost} coins
                </p>
              </div>
              {c.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(c.id, "approve")} loading={actionLoading}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleAction(c.id, "reject")} loading={actionLoading}>
                    Reject
                  </Button>
                </div>
              )}
              {c.status === "active" && (
                <Button size="sm" variant="danger" onClick={() => handleAction(c.id, "pause")} loading={actionLoading}>
                  Pause
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
