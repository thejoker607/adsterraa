import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, PlatformConfig } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function requireApprovedUser(): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    throw new Error("Profile not found");
  }

  if (profile.account_status === "blocked") {
    throw new Error("Account blocked");
  }

  if (profile.account_status !== "approved") {
    throw new Error("Account not approved");
  }

  return { user: { id: user.id, email: user.email }, profile };
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("platform_config").select("key, value");

  const config: Record<string, unknown> = {};
  data?.forEach((row) => {
    config[row.key] = row.value;
  });

  return config as unknown as PlatformConfig;
}

export function getCooldownMinutes(
  tier: Profile["premium_tier"],
  cooldowns: PlatformConfig["cooldowns"]
): number {
  switch (tier) {
    case "tier2":
      return cooldowns.tier2_minutes;
    case "tier1":
      return cooldowns.tier1_minutes;
    default:
      return cooldowns.free_minutes;
  }
}

export function isCooldownActive(
  lastStartedAt: string | null,
  cooldownMinutes: number
): boolean {
  if (!lastStartedAt || cooldownMinutes === 0) return false;
  const elapsed = Date.now() - new Date(lastStartedAt).getTime();
  return elapsed < cooldownMinutes * 60 * 1000;
}
