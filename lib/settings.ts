import { createClient } from "./supabase/server";

export interface ShopSettings {
  bank_id: string;
  account_no: string;
  account_name: string;
  shop_name: string;
}

const DEFAULTS: ShopSettings = {
  bank_id: "MB",
  account_no: "",
  account_name: "",
  shop_name: "WeChat Shop VN",
};

export async function getSettings(): Promise<ShopSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("key, value");
    if (!data) return DEFAULTS;

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    return { ...DEFAULTS, ...map } as ShopSettings;
  } catch {
    return DEFAULTS;
  }
}
