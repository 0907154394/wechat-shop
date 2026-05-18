import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminDb();
  const [{ data: requests }, { data: credits }] = await Promise.all([
    db.from("topup_requests").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20),
    db.from("user_credits").select("balance").eq("user_id", user.id).single(),
  ]);

  return NextResponse.json({ balance: credits?.balance ?? 0, requests: requests ?? [] });
}
