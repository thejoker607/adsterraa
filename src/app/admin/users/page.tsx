"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  coin_balance: number;
  account_status: string;
  premium_tier: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [coinAdjust, setCoinAdjust] = useState<{ userId: string; amount: string; reason: string } | null>(null);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void loadUsers();
  }, []);

  async function performAction(userId: string, action: string, value?: unknown) {
    setActionLoading(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value, reason: (value as { reason?: string })?.reason }),
    });
    setActionLoading(false);
    loadUsers();
  }

  async function handleCoinAdjust() {
    if (!coinAdjust) return;
    setActionLoading(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: coinAdjust.userId,
        action: "adjust_coins",
        value: parseInt(coinAdjust.amount),
        reason: coinAdjust.reason,
      }),
    });
    setActionLoading(false);
    setCoinAdjust(null);
    loadUsers();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600">Approve, block, and manage user accounts.</p>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {user.full_name || user.email}
                  </h3>
                  {statusBadge(user.account_status)}
                  <Badge variant="premium">{user.premium_tier}</Badge>
                </div>
                <p className="text-sm text-slate-600">{user.email}</p>
                <p className="text-sm text-slate-500">
                  {user.coin_balance} coins · Joined {formatDate(user.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.account_status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => performAction(user.id, "approve")} loading={actionLoading}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => performAction(user.id, "reject")} loading={actionLoading}>
                      Reject
                    </Button>
                  </>
                )}
                {user.account_status === "approved" && (
                  <Button size="sm" variant="danger" onClick={() => performAction(user.id, "block")} loading={actionLoading}>
                    Block
                  </Button>
                )}
                {user.account_status === "blocked" && (
                  <Button size="sm" onClick={() => performAction(user.id, "unblock")} loading={actionLoading}>
                    Unblock
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => performAction(user.id, "premium_tier1")} loading={actionLoading}>
                  Tier 1
                </Button>
                <Button size="sm" variant="outline" onClick={() => performAction(user.id, "premium_tier2")} loading={actionLoading}>
                  Tier 2
                </Button>
                <Button size="sm" variant="ghost" onClick={() => performAction(user.id, "premium_free")} loading={actionLoading}>
                  Free
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCoinAdjust({ userId: user.id, amount: "", reason: "" })}
                >
                  Adjust Coins
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!coinAdjust}
        title="Adjust Coin Balance"
        description="Enter the amount (positive to add, negative to deduct) and a reason."
        confirmLabel="Apply"
        onConfirm={handleCoinAdjust}
        onCancel={() => setCoinAdjust(null)}
        loading={actionLoading}
      />
      {coinAdjust && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl pointer-events-auto space-y-3">
            <Input
              label="Amount (+/-)"
              type="number"
              value={coinAdjust.amount}
              onChange={(e) => setCoinAdjust({ ...coinAdjust, amount: e.target.value })}
            />
            <Input
              label="Reason"
              value={coinAdjust.reason}
              onChange={(e) => setCoinAdjust({ ...coinAdjust, reason: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
