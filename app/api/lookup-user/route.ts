import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username } = await req.json();
  if (!username) return NextResponse.json({ email: null });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ email: null });

  const user = data.users.find(
    (u) => u.user_metadata?.username?.toLowerCase() === username.toLowerCase()
  );

  return NextResponse.json({ email: user?.email ?? null });
}
