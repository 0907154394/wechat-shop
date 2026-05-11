import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (username.length < 6 || !/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check username taken
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const taken = existing?.users.some(
    (u) => u.user_metadata?.username?.toLowerCase() === username.toLowerCase()
  );
  if (taken) {
    return NextResponse.json({ error: "username_taken" }, { status: 409 });
  }

  const dummyEmail = `${username}@noemail.local`;

  const { error } = await supabase.auth.admin.createUser({
    email: dummyEmail,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: username },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
