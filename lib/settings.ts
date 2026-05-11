import { createClient as createClientFn } from "@supabase/supabase-js";

function getAdminClient() {
  return createClientFn(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface ShopSettings {
  bank_id: string;
  account_no: string;
  account_name: string;
  shop_name: string;
  zalo: string;
  facebook_page: string;
  wechat_id: string;
  telegram: string;
  usdt_address: string;
  usdt_rate: string;
  binance_api_key: string;
  binance_api_secret: string;
}

const DEFAULTS: ShopSettings = {
  bank_id: "MB",
  account_no: "",
  account_name: "",
  shop_name: "WeChat Shop VN",
  zalo: "",
  facebook_page: "",
  wechat_id: "",
  telegram: "",
  usdt_address: "",
  usdt_rate: "25500",
  binance_api_key: "",
  binance_api_secret: "",
};

export async function getSettings(): Promise<ShopSettings> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase.from("settings").select("key, value");
    if (!data) return DEFAULTS;

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    return { ...DEFAULTS, ...map } as ShopSettings;
  } catch {
    return DEFAULTS;
  }
}
