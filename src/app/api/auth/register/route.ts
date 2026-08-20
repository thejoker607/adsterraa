import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, fullName, referralCode } = parsed.data;
    const supabase = await createClient();
    const admin = createAdminClient();

    let referredBy: string | null = null;
    if (referralCode) {
      const { data: referrer } = await admin
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      referredBy = referrer?.id ?? null;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user && referredBy) {
      await admin
        .from("profiles")
        .update({ referred_by: referredBy })
        .eq("id", data.user.id);
    }

    return NextResponse.json({
      message:
        "Registration successful. Your account is pending admin approval.",
    });
  } catch {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
