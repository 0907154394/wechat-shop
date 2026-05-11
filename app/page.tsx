import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { ScrollAnimations } from "@/components/ScrollAnimations";
import { HomeContent } from "./HomeContent";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: products } = user
    ? await supabase.from("products").select("*").eq("is_active", true).order("price")
    : { data: null };

  return (
    <>
      <ScrollAnimations />
      <HomeContent user={user} products={products as Product[] | null} />
    </>
  );
}
