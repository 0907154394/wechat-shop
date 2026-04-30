export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  amount: number;
  order_code: string;
  status: "pending" | "paid" | "delivered" | "cancelled";
  payment_note: string | null;
  paid_at: string | null;
  created_at: string;
  products?: Product;
}

export interface WechatAccount {
  id: string;
  product_id: string;
  username: string;
  password: string;
  phone_number: string | null;
  backup_email: string | null;
  extra_info: string | null;
  status: "available" | "sold";
  order_id: string | null;
  created_at: string;
}

export interface OrderAccount {
  id: string;
  order_id: string;
  wechat_account_id: string;
  wechat_accounts?: WechatAccount;
  created_at: string;
}

export interface CassoTransaction {
  id: number;
  tid: string;
  description: string;
  amount: number;
  cusum_balance: number;
  when: string;
  bank_sub_acc_id: string;
  subAccId: string;
  virtualAccount: string | null;
  virtualAccountName: string | null;
  corresponsiveName: string | null;
  corresponsiveAccount: string | null;
  corresponsiveBankId: string | null;
  corresponsiveBankName: string | null;
}

export interface CassoWebhookPayload {
  error: number;
  data: {
    id: number;
    sub_account_id: number;
    tid: string;
    description: string;
    amount: number;
    cusum_balance: number;
    when: string;
    bank_sub_acc_id: string;
    records: CassoTransaction[];
  };
}
