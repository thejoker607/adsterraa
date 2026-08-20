import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORM_EMAIL = "platform@adpromo.internal";
const PLATFORM_NAME = "AdPromo Platform";

export async function getOrCreatePlatformProfileId(): Promise<string> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", PLATFORM_EMAIL)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("profiles")
      .update({ account_status: "approved", full_name: PLATFORM_NAME })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: PLATFORM_EMAIL,
    email_confirm: true,
    password: `${crypto.randomUUID()}Aa1!`,
    user_metadata: { full_name: PLATFORM_NAME },
  });

  if (error || !data.user) {
    const { data: listed } = await supabase.auth.admin.listUsers();
    const found = listed?.users.find((user) => user.email === PLATFORM_EMAIL);
    if (!found) {
      throw error ?? new Error("Failed to create platform profile");
    }
    await supabase.from("profiles").upsert({
      id: found.id,
      email: PLATFORM_EMAIL,
      full_name: PLATFORM_NAME,
      account_status: "approved",
    });
    return found.id;
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    email: PLATFORM_EMAIL,
    full_name: PLATFORM_NAME,
    account_status: "approved",
  });

  return data.user.id;
}
