import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referrer_id } = await request.json();
  if (!referrer_id || referrer_id === user.id) {
    return NextResponse.json({ error: "Invalid referral" }, { status: 400 });
  }

  // Verify referrer exists using admin client
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: referrer } = await admin.auth.admin.getUserById(referrer_id);
  if (!referrer.user) return NextResponse.json({ error: "Referrer not found" }, { status: 404 });

  // Create referral (ignore if already exists - unique constraint on referred_id)
  await admin.from("referrals").insert({
    referrer_id,
    referred_id: user.id,
  }).select().single();

  return NextResponse.json({ ok: true });
}
