"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SuccessMessage, ErrorMessage } from "@/components/ui/states";
import { Gift } from "lucide-react";

export function DailyLoginButton({ lastLogin }: { lastLogin: string | null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const claimed = lastLogin === today;

  async function claimDaily() {
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/daily-login", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMessage(`Earned ${data.coinsEarned} coins! New balance: ${data.newBalance}`);
  }

  return (
    <div className="space-y-2">
      {message && <SuccessMessage message={message} />}
      {error && <ErrorMessage message={error} />}
      <Button
        variant="outline"
        size="sm"
        onClick={claimDaily}
        loading={loading}
        disabled={claimed}
        className="w-full"
      >
        <Gift className="h-4 w-4" />
        {claimed ? "Daily Reward Claimed" : "Claim Daily Login Bonus"}
      </Button>
    </div>
  );
}
