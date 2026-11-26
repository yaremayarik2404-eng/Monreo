function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCad(amount) {
  const num = Number(amount) || 0;
  return `CA$${num.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function renderPaidEmailHtml(order = {}) {
  const orderRef = escapeHtml(order.order_ref || order.ref || "MCS-CA");
  const customerName = escapeHtml(order.customer_name || order.name || "Клієнт");
  const email = escapeHtml(order.email || "Не вказано");
  const total = formatCad(order.total_amount ?? order.totalAmount ?? 0);
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #262626;color:#f5f5f5;">
          ${escapeHtml(item.brand ? `${item.brand} — ` : "")}${escapeHtml(item.title || "Archival piece")} × ${Number(item.quantity) || 1}
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #262626;color:#d4af37;font-weight:600;">
          ${formatCad((Number(item.price) || 0) * (Number(item.quantity) || 1))}
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#0d0d0d;font-family:Arial,sans-serif;color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#161616;border:1px solid #2c2c2c;padding:28px;">
    <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#d4af37;margin-bottom:8px;">
      PAYMENT CONFIRMED • PAY STAGE
    </div>
    <h2 style="margin:0 0 16px;font-weight:500;color:#ffffff;">
      Оплату проведено — Замовлення #${orderRef}
    </h2>
    <p style="margin:0 0 6px;color:#cccccc;"><strong>Клієнт:</strong> ${customerName}</p>
    <p style="margin:0 0 18px;color:#cccccc;"><strong>Email:</strong> ${email}</p>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
      ${itemsRows || `<tr><td style="color:#aaa;">Деталі позицій дивіться у замовленні #${orderRef}</td></tr>`}
    </table>
    <div style="font-size:18px;font-weight:700;color:#ffffff;">
      Сплачено: ${total}
    </div>
  </div>
</body>
</html>`;
}

function renderPaidEmailText(order = {}) {
  const orderRef = order.order_ref || order.ref || "MCS-CA";
  const customerName = order.customer_name || order.name || "Клієнт";
  const total = formatCad(order.total_amount ?? order.totalAmount ?? 0);
  return `ОПЛАТУ ПІДТВЕРДЖЕНО (PAY)\nЗамовлення: #${orderRef}\nКлієнт: ${customerName}\nСума: ${total}\n`;
}

module.exports = {
  renderPaidEmailHtml,
  renderPaidEmailText,
};