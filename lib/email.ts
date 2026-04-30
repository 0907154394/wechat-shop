import { Resend } from "resend";
import type { Order, WechatAccount } from "./types";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendOrderDeliveryEmail({
  toEmail,
  order,
  accounts,
}: {
  toEmail: string;
  order: Order;
  accounts: WechatAccount[];
}) {
  const accountRows = accounts
    .map(
      (acc) => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${acc.username}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${acc.password}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${acc.phone_number || "-"}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${acc.backup_email || "-"}</td>
      </tr>`
    )
    .join("");

  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: toEmail,
    subject: `[${process.env.NEXT_PUBLIC_SHOP_NAME}] Đơn hàng ${order.order_code} - Tài khoản WeChat của bạn`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a1a1a">Đơn hàng ${order.order_code} đã hoàn thành!</h2>
        <p>Cảm ơn bạn đã mua hàng. Dưới đây là thông tin tài khoản WeChat:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Username</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Password</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">SĐT</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Email backup</th>
            </tr>
          </thead>
          <tbody>${accountRows}</tbody>
        </table>

        <p style="color:#6b7280;font-size:14px">
          Bạn cũng có thể xem lại thông tin này trong trang
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}">quản lý đơn hàng</a>.
        </p>
        <p style="color:#6b7280;font-size:12px">
          Lưu ý: Đây là email tự động, vui lòng không reply.
        </p>
      </div>
    `,
  });
}
