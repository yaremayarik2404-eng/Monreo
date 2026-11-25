/**
 * MONROE CLOSET STUDIO — LUXURY EMAIL TEMPLATES
 * Generates editorial, high-fashion responsive emails for:
 * 1. Archive Rentals (dates, duration, purpose, client details, item)
 * 2. Purchase Orders (line items, pricing, delivery, client details)
 * 3. Fallback text/messages
 */

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
    maximumFractionDigits: 2
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "Not specified";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (_) {
    return String(dateStr);
  }
}

/**
 * Main exportable template function
 * Supports both legacy string message and rich order payload
 */
function emailTemplate(data) {
  if (!data) {
    return renderSimpleMessage("Нове повідомлення від Monroe Closet");
  }

  // If a simple string was passed
  if (typeof data === "string") {
    return renderSimpleMessage(data);
  }

  // If rich order object was passed
  return renderOrderEmail(data);
}

/**
 * Renders simple text inside the luxury Monroe layout
 */
function renderSimpleMessage(message) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monroe Closet Studio</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f6f5; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e8e8e8; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <h1 style="margin: 0 0 6px; font-family: 'Georgia', serif; font-size: 26px; letter-spacing: 0.25em; text-transform: uppercase; color: #111111; font-weight: 400;">MONROE</h1>
              <div style="font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #888888;">Closet Studio • Archive Toronto</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px; font-size: 14px; line-height: 1.7; color: #333333; white-space: pre-line;">
              ${escapeHtml(message)}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center; font-size: 11px; letter-spacing: 0.12em; color: #999999; text-transform: uppercase;">
              © 2026 Monroe Closet Studio • Toronto, ON
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Builds rich, responsive luxury HTML email for Rental or Purchase
 */
function renderOrderEmail(order) {
  const isRental = order.isRental || order.type === "rental" || Boolean(order.rental_details);
  const orderRef = escapeHtml(order.order_ref || order.orderRef || order.ref || "MCS-CA-NEW");
  const dateFormatted = new Date().toLocaleString("uk-UA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Client info
  const customerName = escapeHtml(order.customer_name || order.customerName || order.name || "Клієнт");
  const phone = escapeHtml(order.phone || "Не вказано");
  const email = escapeHtml(order.email || "Не вказано");
  const instagram = escapeHtml(order.social_handle || order.instagram || order.social || "").replace(/^@/, "");

  // Shipping & Address
  const deliveryMethod = escapeHtml(order.delivery_method || order.deliveryMethod || "Canada Post Expedited");
  const address = escapeHtml(order.branch_or_address || order.address || "Не вказано");
  const city = escapeHtml(order.city || "");
  const paymentMethod = escapeHtml(order.payment_method || order.paymentMethod || "Stripe");
  const status = escapeHtml(order.status || (paymentMethod === "stripe" ? "Очікує оплати Stripe" : "Підтверджено"));
  const notes = escapeHtml(order.notes || "Немає приміток");

  // Rental specific details
  const rentalDetails = order.rental_details || order.rentalDetails || {};
  const rentalStart = formatDate(rentalDetails.startDate || order.rentalStartDate || order.start_date);
  const rentalEnd = formatDate(rentalDetails.endDate || order.rentalEndDate || order.end_date);
  const rentalDays = rentalDetails.days || order.rentalDays || order.durationDays || "3";
  const rentalPurpose = escapeHtml(rentalDetails.purpose || order.rentalPurpose || "Photoshoot / Event");

  // Items
  const items = Array.isArray(order.items) ? order.items : [];
  const totalAmount = order.total_amount ?? order.totalAmount ?? order.total ?? 0;

  // Build items rows HTML
  const itemsHtml = items.map((item) => {
    const title = escapeHtml(item.title || "Archival piece");
    const brand = escapeHtml(item.brand || "Monroe Archive");
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = formatCad(price * qty);
    const imgUrl = item.image && /^https?:\/\//i.test(item.image)
      ? item.image
      : null;

    return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #eeeeee;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              ${imgUrl ? `
                <td width="72" style="vertical-align: top; padding-right: 16px;">
                  <img src="${escapeHtml(imgUrl)}" alt="${title}" width="72" height="90" style="object-fit: cover; display: block; border: 1px solid #e8e8e8; background-color: #f7f7f7;">
                </td>
              ` : `
                <td width="48" style="vertical-align: top; padding-right: 14px;">
                  <div style="width: 48px; height: 60px; background-color: #111111; color: #ffffff; font-family: Georgia, serif; font-size: 16px; text-align: center; line-height: 60px; letter-spacing: 0.1em;">M</div>
                </td>
              `}
              <td style="vertical-align: middle;">
                <div style="font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #888888; margin-bottom: 4px;">${brand}</div>
                <div style="font-size: 14px; font-weight: 500; color: #111111; margin-bottom: 4px; line-height: 1.4;">${title}</div>
                <div style="font-size: 12px; color: #777777;">
                  ${isRental ? `Тариф оренди: ${formatCad(price)}` : `Кількість: ${qty} × ${formatCad(price)}`}
                </div>
              </td>
              <td align="right" style="vertical-align: middle; font-size: 14px; font-weight: 600; color: #111111; white-space: nowrap;">
                ${lineTotal}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  const orderTypeBadge = isRental
    ? `<span style="display: inline-block; background-color: #111111; color: #d4af37; padding: 6px 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid #d4af37;">✨ ЗАПИТ НА ОРЕНДУ (RENTAL)</span>`
    : `<span style="display: inline-block; background-color: #111111; color: #ffffff; padding: 6px 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;">🛍️ ЗАМОВЛЕННЯ НА КУПІВЛЮ</span>`;

  return `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isRental ? "Новий запит на оренду" : "Нове замовлення"} | Monroe Closet Studio</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; -webkit-font-smoothing: antialiased;">

  <!-- Outer Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f4; padding: 32px 12px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border: 1px solid #e5e5e5; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">

          <!-- Brand Top Bar -->
          <tr>
            <td style="padding: 32px 36px 24px; text-align: center; border-bottom: 1px solid #eeeeee;">
              <div style="font-family: 'Georgia', serif; font-size: 26px; letter-spacing: 0.28em; text-transform: uppercase; color: #111111; font-weight: 400; margin-bottom: 4px;">MONROE</div>
              <div style="font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: #999999;">Closet Studio • Archival Collection & Rental • Toronto</div>
            </td>
          </tr>

          <!-- Notification Banner -->
          <tr>
            <td style="padding: 26px 36px 20px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #eeeeee;">
              <div style="margin-bottom: 12px;">${orderTypeBadge}</div>
              <h2 style="margin: 0 0 6px; font-family: 'Georgia', serif; font-size: 22px; font-weight: 400; color: #111111;">
                ${isRental ? "Новий запит на оренду архіву" : "Нове замовлення клієнта"}
              </h2>
              <div style="font-size: 13px; color: #666666;">
                Номер замовлення: <strong style="color: #111111; letter-spacing: 0.05em;">${orderRef}</strong>
              </div>
              <div style="font-size: 11px; color: #999999; margin-top: 4px;">${dateFormatted} (Toronto Time)</div>
            </td>
          </tr>

          <!-- Highlight Status Box -->
          <tr>
            <td style="padding: 20px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fbfbfb; border: 1px solid #eeeeee; padding: 14px 18px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #888888; margin-bottom: 2px;">Загальна сума</div>
                    <div style="font-size: 20px; font-weight: 700; color: #111111;">${formatCad(totalAmount)}</div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #888888; margin-bottom: 2px;">Оплата</div>
                    <div style="font-size: 13px; font-weight: 600; color: #111111;">${paymentMethod.toUpperCase()}</div>
                    <div style="font-size: 11px; color: #555555;">${status}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${isRental ? `
          <!-- RENTAL SPECIFIC DETAILS BOX -->
          <tr>
            <td style="padding: 0 36px 20px;">
              <div style="background-color: #fdfcf7; border: 1px solid #ebdcb2; padding: 18px 20px;">
                <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #916c16; margin-bottom: 12px;">
                  📅 ДЕТАЛІ ОРЕНДИ ТА ДАТИ
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.8;">
                  <tr>
                    <td width="40%" style="color: #666666;">Початок оренди:</td>
                    <td style="font-weight: 600; color: #111111;">${rentalStart}</td>
                  </tr>
                  <tr>
                    <td style="color: #666666;">Повернення виробу:</td>
                    <td style="font-weight: 600; color: #111111;">${rentalEnd}</td>
                  </tr>
                  <tr>
                    <td style="color: #666666;">Тривалість:</td>
                    <td style="font-weight: 600; color: #111111;">${rentalDays} дні(в)</td>
                  </tr>
                  <tr>
                    <td style="color: #666666;">Мета / Подія:</td>
                    <td style="font-weight: 600; color: #111111;">${rentalPurpose}</td>
                  </tr>
                  <tr>
                    <td style="color: #666666;">Гарантійний депозит:</td>
                    <td style="color: #555555;">CA$250.00 (холдується при примірці/відправці)</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- CUSTOMER DETAILS SECTION -->
          <tr>
            <td style="padding: 10px 36px 24px;">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #111111; padding-bottom: 8px; border-bottom: 1px solid #eeeeee; margin-bottom: 14px;">
                👤 КЛІЄНТ ТА КОНТАКТИ
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.8;">
                <tr>
                  <td width="36%" style="color: #777777;">Повне ім'я:</td>
                  <td style="font-weight: 600; color: #111111;">${customerName}</td>
                </tr>
                <tr>
                  <td style="color: #777777;">Телефон:</td>
                  <td>
                    <a href="tel:${phone}" style="color: #111111; font-weight: 600; text-decoration: underline;">${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #777777;">Email:</td>
                  <td>
                    <a href="mailto:${email}" style="color: #111111; text-decoration: underline;">${email}</a>
                  </td>
                </tr>
                ${instagram ? `
                <tr>
                  <td style="color: #777777;">Instagram:</td>
                  <td>
                    <a href="https://instagram.com/${instagram}" target="_blank" style="color: #d44f77; font-weight: 600; text-decoration: none;">@${instagram} ↗</a>
                  </td>
                </tr>
                ` : ""}
              </table>
            </td>
          </tr>

          

          <!-- ITEMS SECTION -->
          <tr>
            <td style="padding: 0 36px 20px;">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #111111; padding-bottom: 8px; border-bottom: 1px solid #eeeeee; margin-bottom: 8px;">
                ✨ ВИБРАНІ ПРЕДМЕТИ (${items.length})
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- TOTALS SUMMARY -->
          <tr>
            <td style="padding: 10px 36px 26px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 2;">
                <tr>
                  <td style="color: #777777;">Вартість виробів / оренди:</td>
                  <td align="right" style="color: #111111;">${formatCad(totalAmount)}</td>
                </tr>
                <tr>
                  <td style="color: #777777;">Доставка / Примірка:</td>
                  <td align="right" style="color: #111111;">Включено / Безкоштовно</td>
                </tr>
                <tr style="border-top: 1px solid #111111;">
                  <td style="font-size: 15px; font-weight: 700; color: #111111; padding-top: 8px;">Загальний підсумок (CAD):</td>
                  <td align="right" style="font-size: 16px; font-weight: 700; color: #111111; padding-top: 8px;">${formatCad(totalAmount)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- NOTES IF ANY -->
          ${notes && notes !== "Немає приміток" ? `
          <tr>
            <td style="padding: 0 36px 28px;">
              <div style="background-color: #fafafa; border-left: 3px solid #111111; padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #333333;">
                <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #777777; margin-bottom: 4px;">ПРИМІТКИ КЛІЄНТА / FITTING NOTES</div>
                ${notes}
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- ACTION BUTTONS FOR OWNER -->
          <tr>
            <td style="padding: 10px 36px 36px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="mailto:${email}?subject=Monroe%20Closet%20Studio%20—%20Order%20${encodeURIComponent(orderRef)}" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 22px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; border-radius: 0;">
                      Відповісти на Email
                    </a>
                  </td>
                  ${phone && phone !== "Не вказано" ? `
                  <td style="padding: 0 6px;">
                    <a href="tel:${phone}" style="display: inline-block; background-color: #ffffff; color: #111111; text-decoration: none; padding: 11px 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; border: 1px solid #111111;">
                      Зателефонувати
                    </a>
                  </td>
                  ` : ""}
                  ${instagram ? `
                  <td style="padding: 0 6px;">
                    <a href="https://instagram.com/${instagram}" target="_blank" style="display: inline-block; background-color: #f7f7f7; color: #333333; text-decoration: none; padding: 11px 18px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; border: 1px solid #e0e0e0;">
                      Instagram ↗
                    </a>
                  </td>
                  ` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center;">
              <div style="font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #888888; margin-bottom: 6px;">
                MONROE CLOSET STUDIO • ARCHIVE TORONTO
              </div>
              <div style="font-size: 11px; color: #aaaaaa; line-height: 1.5;">
                Автоматичне сповіщення для власника. Консьєрж-сервіс, оренда та продаж архівного одягу.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

/**
 * Generates plain text version for email clients that do not render HTML
 */
function generateOrderText(order) {
  const isRental = order.isRental || order.type === "rental" || Boolean(order.rental_details);
  const orderRef = order.order_ref || order.orderRef || order.ref || "MCS-CA-NEW";
  const customerName = order.customer_name || order.customerName || order.name || "Клієнт";
  const phone = order.phone || "Не вказано";
  const email = order.email || "Не вказано";
  const instagram = order.social_handle || order.instagram || "";
  const total = formatCad(order.total_amount ?? order.totalAmount ?? order.total ?? 0);
  const payment = (order.payment_method || order.paymentMethod || "Stripe").toUpperCase();
  const address = order.branch_or_address || order.address || "Не вказано";
  const notes = order.notes || "Немає";

  let out = `====================================================\n`;
  out += `MONROE CLOSET STUDIO — ${isRental ? "НОВИЙ ЗАПИТ НА ОРЕНДУ" : "НОВЕ ЗАМОВЛЕННЯ"}\n`;
  out += `Номер: ${orderRef}\n`;
  out += `Загальна сума: ${total} (Оплата: ${payment})\n`;
  out += `====================================================\n\n`;

  out += `КЛІЄНТ:\n`;
  out += `- Ім'я: ${customerName}\n`;
  out += `- Телефон: ${phone}\n`;
  out += `- Email: ${email}\n`;
  if (instagram) out += `- Instagram: @${instagram.replace(/^@/, "")}\n`;
  out += `\n`;

  if (isRental) {
    const rd = order.rental_details || {};
    out += `ДЕТАЛІ ОРЕНДИ:\n`;
    out += `- Початок: ${formatDate(rd.startDate || order.rentalStartDate)}\n`;
    out += `- Повернення: ${formatDate(rd.endDate || order.rentalEndDate)}\n`;
    out += `- Тривалість: ${rd.days || order.rentalDays || "3"} днів\n`;
    out += `- Мета: ${rd.purpose || order.rentalPurpose || "Photoshoot / Event"}\n\n`;
  }

  out += `ДОСТАВКА:\n`;
  out += `- Спосіб: ${order.delivery_method || order.deliveryMethod || "Canada Post"}\n`;
  out += `- Адреса: ${address}\n\n`;

  out += `ВИРОБИ:\n`;
  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((it, idx) => {
    out += `${idx + 1}. ${it.brand ? it.brand + " - " : ""}${it.title || "Archival piece"} | ${formatCad(it.price)}\n`;
  });

  out += `\nПримітки: ${notes}\n`;
  out += `====================================================\n`;
  return out;
}

module.exports = emailTemplate;
module.exports.emailTemplate = emailTemplate;
module.exports.renderOrderEmail = renderOrderEmail;
module.exports.generateOrderText = generateOrderText;
