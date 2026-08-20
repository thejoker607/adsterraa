import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const email = process.env.ADMIN_EMAIL || "admin@adpromo.local";
const password = process.env.ADMIN_PASSWORD || "Admin123!";
const name = process.env.ADMIN_NAME || "System Admin";

async function seedAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const passwordHash = await bcrypt.hash(password, 12);

  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash, is_active: true })
      .eq("email", email);
    if (error) {
      console.error("Failed to update admin:", error.message);
      process.exit(1);
    }
    console.log(`Updated admin user: ${email}`);
  } else {
    const { error } = await supabase.from("admin_users").insert({
      email,
      password_hash: passwordHash,
      name,
    });
    if (error) {
      console.error("Failed to create admin:", error.message);
      console.error("Did you run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor?");
      process.exit(1);
    }
    console.log(`Created admin user: ${email}`);
  }

  console.log(`Password: ${password}`);
  console.log("Change the password after first login in production.");
}

seedAdmin().catch(console.error);
