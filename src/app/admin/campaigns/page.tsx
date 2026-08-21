"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { statusBadge } from "@/components/ui/badge";
import { ErrorMessage, LoadingSpinner, SuccessMessage } from "@/components/ui/states";
import { ExternalLink } from "lucide-react";
import { useOnAppRefresh } from "@/lib/app-refresh";

interface Campaign {
  id: string;
  status: string;
  target_impressions: number;
  current_impressions: number;
  coin_cost: number;
  admin_notes: string | null;
  promotions: { title: string; url: string; description: string | null };
  profiles: { email: string; full_name: string | null } | null;
}

function isAdminPublished(campaign: Campaign) {
  return campaign.admin_notes?.includes("[admin-published]") ?? false;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    targetImpressions: 1000,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void load();
  }, [load]);

  useOnAppRefresh(load);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPublishing(true);

    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        url: form.url,
        targetImpressions: form.targetImpressions,
      }),
    });

    const data = await res.json();
    setPublishing(false);

    if (!res.ok) {
      setError(data.error || "Failed to publish campaign");
      return;
    }

    setSuccess("Campaign published and is now live. No coins were charged.");
    setForm({ title: "", description: "", url: "", targetImpressions: 1000 });
    load();
  }

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
        <h1 className="text-2xl font-bold text-slate-900">Campaign Review</h1>
        <p className="text-slate-600">
          Publish platform campaigns for free, then review user submissions.
        </p>
      </div>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Publish Campaign</h2>
        <p className="mb-4 text-sm text-slate-600">
          Admin campaigns go live immediately. No coins, cooldowns, or impression caps.
        </p>
        <form onSubmit={handlePublish} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Platform promotion"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Optional description"
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
            label="Target impressions"
            type="number"
            min={1}
            value={form.targetImpressions}
            onChange={(e) =>
              setForm({
                ...form,
                targetImpressions: parseInt(e.target.value) || 1,
              })
            }
            required
          />
          <Button type="submit" loading={publishing}>
            Publish campaign
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{c.promotions.title}</h3>
                  {statusBadge(c.status)}
                </div>
                <p className="text-sm text-slate-600">
                  by {c.profiles?.full_name || c.profiles?.email || "Platform"}
                </p>
                {c.promotions.description && (
                  <p className="mt-1 text-sm text-slate-700">{c.promotions.description}</p>
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
                <p className="mt-2 text-sm text-slate-500">
                  {c.current_impressions}/{c.target_impressions} impressions ·{" "}
                  {isAdminPublished(c) || c.coin_cost === 0
                    ? "Free (admin)"
                    : `${c.coin_cost} coins`}
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
