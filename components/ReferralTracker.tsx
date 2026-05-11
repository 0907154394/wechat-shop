"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) localStorage.setItem("ref_code", ref);
  }, [params]);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const sb = createClient();
      sb.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const refCode = localStorage.getItem("ref_code");
          if (refCode && refCode !== session.user.id) {
            fetch("/api/referral/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referrer_id: refCode }),
            }).finally(() => localStorage.removeItem("ref_code"));
          }
        }
      });
    });
  }, []);

  return null;
}
