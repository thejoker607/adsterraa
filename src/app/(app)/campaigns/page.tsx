"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { statusBadge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState } from "@/components/ui/states";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  status: string;
  target_impressions: number;
  current_impressions: number;
  coin_cost: number;
  created_at: string;
  promotions: {
    title: string;
    url: string;
    description: string | null;
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Campaigns</h1>
          <p className="text-slate-600">Track your promotion campaigns and statistics.</p>
        </div>
        <Link href="/promotions/create">
          <Button>Create New</Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first promotion to get started."
          action={
            <Link href="/promotions/create">
              <Button>Create Promotion</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const progress =
              c.target_impressions > 0
                ? (c.current_impressions / c.target_impressions) * 100
                : 0;
            return (
              <Card key={c.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{c.promotions.title}</h3>
                      {statusBadge(c.status)}
                    </div>
                    {c.promotions.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {c.promotions.description}
                      </p>
                    )}
                    <a
                      href={c.promotions.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                    >
                      {c.promotions.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{c.coin_cost} coins spent</p>
                    <p className="text-slate-500">
                      {c.current_impressions} / {c.target_impressions} impressions
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
