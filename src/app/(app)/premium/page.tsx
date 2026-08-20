import { requireApprovedUser } from "@/lib/auth/user";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, X } from "lucide-react";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cooldown: "30 min same-promotion cooldown",
    features: [
      "Publish promotions",
      "Runner access",
      "Daily login rewards",
      "30 min cooldown on same promotion restart",
    ],
    missing: ["Reduced cooldown", "No cooldown"],
  },
  {
    id: "tier1",
    name: "Premium Tier 1",
    price: "Admin assigned",
    cooldown: "15 min same-promotion cooldown",
    features: [
      "All Free features",
      "15 min campaign cooldown",
      "Priority support",
    ],
    missing: ["No cooldown"],
  },
  {
    id: "tier2",
    name: "Premium Tier 2",
    price: "Admin assigned",
    cooldown: "No campaign cooldown",
    features: [
      "All Tier 1 features",
      "No campaign cooldown",
      "Maximum flexibility",
    ],
    missing: [],
  },
];

export default async function PremiumPage() {
  const { profile } = await requireApprovedUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Premium</h1>
        <p className="text-slate-600">
          Upgrade your account for reduced campaign cooldowns. Contact an admin
          or earn premium through platform activities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = profile.premium_tier === tier.id;
          return (
            <Card
              key={tier.id}
              className={`relative ${isCurrent ? "ring-2 ring-indigo-600" : ""}`}
            >
              {isCurrent && (
                <Badge variant="premium" className="absolute -top-2 right-4">
                  Current Plan
                </Badge>
              )}
              <div className="mb-4 flex items-center gap-2">
                <Crown
                  className={`h-5 w-5 ${
                    tier.id === "tier2"
                      ? "text-violet-600"
                      : tier.id === "tier1"
                        ? "text-indigo-600"
                        : "text-slate-400"
                  }`}
                />
                <h3 className="text-lg font-bold">{tier.name}</h3>
              </div>
              <p className="text-2xl font-bold">{tier.price}</p>
              <p className="mt-1 text-sm text-slate-500">{tier.cooldown}</p>

              <ul className="mt-6 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
