"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner, ErrorMessage, SuccessMessage } from "@/components/ui/states";
import { useOnAppRefresh } from "@/lib/app-refresh";

export default function AdminAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const load = useCallback(() => {
    fetch("/api/admin/account")
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) {
          setForm((f) => ({
            ...f,
            name: d.admin.name,
            email: d.admin.email,
          }));
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOnAppRefresh(load);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword || undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }

    setSuccess(data.message || "Account updated");
    setForm((f) => ({
      ...f,
      name: data.admin.name,
      email: data.admin.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Account</h1>
        <p className="text-slate-600">Update your display name, email, or password.</p>
      </div>

      <Card title="Account Settings">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          <Input
            label="Display Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Change Password (optional)</p>
            <div className="space-y-3">
              <Input
                label="New Password"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
            </div>
          </div>

          <Input
            label="Current Password"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
            placeholder="Required to save any changes"
            autoComplete="current-password"
          />

          <Button type="submit" loading={saving} className="w-full">
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
