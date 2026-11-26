require("dotenv").config();
const express = require("express");
const path = require("path");
const emailTemplate = require("./email");

const app = express();
const port = Number(process.env.PORT) || 3000;

// =============================================================================
// STRIPE SETUP
// =============================================================================
const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
const isStripeConfigured = Boolean(
  stripeSecretKey &&
  !stripeSecretKey.includes("replace_with_your_stripe_secret_key")
);
const stripe = isStripeConfigured ? require("stripe")(stripeSecretKey) : null;

// =============================================================================
// EMAIL SETUP (Brevo HTTP API)
// =============================================================================
const ownerEmail = (process.env.MAIN_USER || "yaremayarik2404@gmail.com").trim();
const mailFrom = (process.env.MAIL_FROM || ownerEmail).trim();
const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();

function renderEmailHtml(payload) {
  if (typeof emailTemplate === "function") {
    return emailTemplate(payload);
  }
  if (emailTemplate && typeof emailTemplate.generateOrderHtml === "function") {
    return emailTemplate.generateOrderHtml(payload);
  }
  return `<pre>${escapeHtml(
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)
  )}</pre>`;
}

function renderEmailText(payload) {
  if (emailTemplate && typeof emailTemplate.generateOrderText === "function") {
    return emailTemplate.generateOrderText(payload);
  }
  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendOrderEmail({ to, subject, html, text }) {
  if (!brevoApiKey) {
    console.warn("⚠️ BREVO_API_KEY не задано — лист не відправлено");
    return { skipped: true, messageId: null };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Monroe Closet Studio",
        email: mailFrom,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errText}`);
  }

  return res.json();
}

// =============================================================================
// MIDDLEWARE & STATIC PAGES
// =============================================================================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const pageRoutes = [
  ["/", "index.html"],
  ["/shop", "shop.html"],
  ["/product", "product.html"],
  ["/rental", "rental.html"],
  ["/styling", "styling.html"],
  ["/about", "about.html"],
  ["/checkout", "checkout.html"],
];

for (const [route, fileName] of pageRoutes) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, "public", fileName));
  });
}

// Healthcheck / quick check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    stripeConfigured: Boolean(stripe),
    brevoConfigured: Boolean(brevoApiKey),
  });
});

// =============================================================================
// STRIPE CHECKOUT SESSION API (Canada - CAD)
// =============================================================================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error:
          "Stripe is not configured yet. Please add a valid STRIPE_SECRET_KEY to environment variables.",
      });
    }

    const { items, customer_email, order_ref, success_url, cancel_url } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const line_items = items.map((item) => {
      const unitAmount = Math.max(50, Math.round((Number(item.price) || 0) * 100));
      return {
        price_data: {
          currency: "cad",
          product_data: {
            name: `${item.brand ? `${item.brand} — ` : ""}${item.title || "Archival piece"}`,
            images: item.image && /^https?:\/\//i.test(item.image) ? [item.image] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
      };
    });

    const forwardedProto = req.headers["x-forwarded-proto"];
    const protocol = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : (forwardedProto || req.protocol || "https").split(",")[0].trim();
    const host = req.get("host") || `localhost:${port}`;
    const defaultBaseUrl = `${protocol}://${host}`;

    const safeSuccessUrl =
      typeof success_url === "string" && /^https?:\/\//i.test(success_url)
        ? success_url
        : `${defaultBaseUrl}/checkout.html?stripe_status=success&ref=${encodeURIComponent(order_ref || "")}`;

    const safeCancelUrl =
      typeof cancel_url === "string" && /^https?:\/\//i.test(cancel_url)
        ? cancel_url
        : `${defaultBaseUrl}/checkout.html?stripe_status=cancelled&ref=${encodeURIComponent(order_ref || "")}`;

    const session = await stripe.checkout.sessions.create({
      allowed_payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customer_email || undefined,
      client_reference_id: order_ref,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["CA", "US", "GB", "UA", "FR", "DE", "IT", "ES"],
      },
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("❌ Stripe Session Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to create Stripe Checkout session",
    });
  }
});

app.get("/api/stripe-config", (req, res) => {
  res.json({
    configured: Boolean(stripe),
    publishableKey: (process.env.STRIPE_PUBLISHABLE_KEY || "").trim() || null,
  });
});

// =============================================================================
// ORDER NOTIFICATIONS (Brevo API)
// =============================================================================
async function handleSendOrderEmail(orderData, res) {
  try {
    const isRental = Boolean(
      orderData.isRental ||
      orderData.type === "rental" ||
      orderData.rental_details
    );
    const orderRef = orderData.order_ref || orderData.orderRef || orderData.ref || "MCS-CA";
    const customer = orderData.customer_name || orderData.name || "Клієнт";
    const totalAmount = orderData.total_amount ?? orderData.totalAmount ?? "";
    const totalFormatted =
      totalAmount !== "" && !Number.isNaN(Number(totalAmount))
        ? ` (CA$${Number(totalAmount).toFixed(2)})`
        : "";

    const subject = isRental
      ? `[Monroe Archive] 📅 Новий запит на ОРЕНДУ: #${orderRef}${totalFormatted} — ${customer}`
      : `[Monroe Archive] 🛍️ Нове замовлення: #${orderRef}${totalFormatted} — ${customer}`;

    const htmlBody = renderEmailHtml(orderData);
    const textBody = renderEmailText(orderData);

    console.log(
      `📩 Відправка email для замовлення #${orderRef} (${isRental ? "ОРЕНДА" : "КУПІВЛЯ"})...`
    );

    const info = await sendOrderEmail({
      to: ownerEmail,
      subject,
      html: htmlBody,
      text: textBody,
    });

    if (info?.skipped) {
      return res.status(200).json({
        status: "OK",
        skipped: true,
        message: "Email skipped because BREVO_API_KEY is not configured",
      });
    }

    console.log("✅ Email успішно надіслано через Brevo! Message ID:", info?.messageId || "");
    return res.status(200).json({
      status: "OK",
      message: "Order notification email successfully sent",
      messageId: info?.messageId || null,
    });
  } catch (error) {
    console.error("❌ Помилка при відправці email:", error.message);
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
}

app.post("/api/send-order-email", async (req, res) => {
  const orderData = req.body?.order || req.body;
  if (!orderData || typeof orderData !== "object") {
    return res.status(400).json({ error: "No order payload provided" });
  }
  return handleSendOrderEmail(orderData, res);
});

app.post("/send", async (req, res) => {
  console.log("📩 Запит /send отримано");
  const payload = req.body || {};

  if (payload.order || (payload.customer_name && payload.items)) {
    return handleSendOrderEmail(payload.order || payload, res);
  }

  const message = payload.message || "Повідомлення від Monroe Closet Studio";

  try {
    const info = await sendOrderEmail({
      to: ownerEmail,
      subject: "Monroe Closet Studio — Нове повідомлення",
      html: renderEmailHtml(message),
      text: renderEmailText(message),
    });

    console.log("✅ Brevo response:", info?.messageId || "OK");
    return res.status(200).json({
      status: "OK",
      message: info?.skipped ? "Email skipped (no BREVO_API_KEY)" : "Email sent via Brevo",
      messageId: info?.messageId || null,
    });
  } catch (error) {
    console.error("❌ Помилка:", error.message);
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Express error:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Unexpected server error",
  });
});

// =============================================================================
// START SERVER
// =============================================================================
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

server.on("error", (err) => {
  console.error("❌ Server listen error:", err);
  process.exit(1);
});