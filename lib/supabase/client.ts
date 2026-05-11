import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          if (typeof document === "undefined") return undefined;
          const match = document.cookie.match(
            new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
          );
          return match ? decodeURIComponent(match[1]) : undefined;
        },
        set(name, value, options) {
          if (typeof document === "undefined") return;
          // Session cookie: no Max-Age / Expires → cleared when browser closes
          let c = `${name}=${encodeURIComponent(value)}`;
          if (options?.path) c += `; Path=${options.path}`;
          else c += `; Path=/`;
          if (options?.domain) c += `; Domain=${options.domain}`;
          if (options?.sameSite) c += `; SameSite=${options.sameSite}`;
          if (options?.secure || (typeof window !== "undefined" && window.location.protocol === "https:"))
            c += `; Secure`;
          document.cookie = c;
        },
        remove(name, options) {
          if (typeof document === "undefined") return;
          let c = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          c += `; Path=${options?.path ?? "/"}`;
          document.cookie = c;
        },
      },
    }
  );
}
