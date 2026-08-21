"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/states";
import { formatCoins, formatDate } from "@/lib/utils";
import { Coins } from "lucide-react";
import { useOnAppRefresh } from "@/lib/app-refresh";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.balance || 0);
        setTransactions(d.transactions || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOnAppRefresh(load);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coin Wallet</h1>
        <p className="text-slate-600">Your coin balance and transaction history.</p>
      </div>

      <Card className="!p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Coins className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Available Balance</p>
            <p className="text-3xl font-bold">{formatCoins(balance)}</p>
          </div>
        </div>
      </Card>

      <Card title="Transaction History">
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {tx.description || tx.transaction_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                </div>
                <span
                  className={`font-semibold ${
                    tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCoins(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
