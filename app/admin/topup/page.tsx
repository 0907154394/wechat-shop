export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { TopupManager } from "./TopupManager";

export default async function AdminTopupPage() {
  const supabase = await createAdminClient();
  const { data: requests } = await supabase
    .from("topup_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Duyệt nạp tiền USDT</h1>
        <p className="mt-1 text-sm text-gray-500">Kiểm tra TX Hash trên Tronscan rồi bấm Duyệt để cộng tiền vào ví khách</p>
      </div>
      <TopupManager requests={requests ?? []} />
    </div>
  );
}
