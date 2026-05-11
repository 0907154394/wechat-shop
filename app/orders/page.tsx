export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { OrdersPageContent } from "./OrdersPageContent";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as Order[];
  const displayName = user.user_metadata?.full_name?.split(" ").pop()
    || user.user_metadata?.username
    || user.email?.split("@")[0]
    || "bạn";

  const stats = {
    total:      list.length,
    pending:    list.filter(o => o.status === "pending").length,
    delivered:  list.filter(o => o.status === "delivered").length,
    totalSpent: list.filter(o => o.status === "delivered").reduce((s, o) => s + o.amount, 0),
  };

  return (
    <OrdersPageContent
      orders={list}
      displayName={displayName}
      stats={stats}
    />
  );
}
