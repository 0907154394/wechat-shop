import { createServerClient } from "@supabase/ssr";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Session cookie: strip maxAge/expires so browser clears on close
              const { maxAge, expires, ...rest } = options ?? {};
              cookieStore.set(name, value, rest);
            });
          } catch {}
        },
      },
    }
  );
}

// Direct service_role client — bypasses RLS, no user cookie context
export function createAdminClient() {
  return createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
