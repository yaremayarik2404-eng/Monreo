require("dotenv").config();
const express = require("express");
const path = require("path");
const emailTemplate = require("./email");
const paidEmailTemplate = require("./emailPay")

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
const checkoutEmail = (process.env.CHECKOUT_EMAIL || ownerEmail).trim();
const payEmail = (process.env.PAY_EMAIL || ownerEmail).trim();
const mailFrom = (process.env.MAIL_FROM || ownerEmail).trim();
const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();

function normalizeStage(payload = {}) {
  const rawStage = String(
    payload.stage || payload.action || payload.event || ""
  )
    .trim()
    .toLowerCase();

  if (rawStage === "checkout" || rawStage === "proceed_to_checkout" || rawStage === "proceed-to-checkout") {
    return "checkout";
  }
  if (rawStage === "pay" || rawStage === "payment") {
    return "pay";
  }
  return "default";
}

function resolveRecipientEmail(payload = {}) {
  const stage = normalizeStage(payload);
  if (stage === "checkout") return checkoutEmail;
  if (stage === "pay") return payEmail;
  return ownerEmail;
}

function isPayStage(payload) {
  if (!payload || typeof payload !== "object") return false;
  const stage = String(payload.stage || "").trim().toLowerCase();
  return stage === "pay" || payload.status === "paid_stripe";
}

function renderEmailHtml(payload) {
  if (isPayStage(payload) && paidEmailTemplate && typeof paidEmailTemplate.renderPaidEmailHtml === "function") {
    return paidEmailTemplate.renderPaidEmailHtml(payload);
  }
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
  if (isPayStage(payload) && paidEmailTemplate && typeof paidEmailTemplate.renderPaidEmailText === "function") {
    return paidEmailTemplate.renderPaidEmailText(payload);
  }
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

const sentPaidWebhookRefs = new Set();

app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    const signature = req.headers["stripe-signature"];

    if (!stripe) {
      return res.status(503).json({ error: "Stripe is not configured" });
    }
    if (!webhookSecret || !signature) {
      return res.status(400).json({ error: "Missing webhook secret or stripe-signature header" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Stripe webhook signature error:", err.message);
      return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderRef =
        session.client_reference_id ||
        session.metadata?.order_ref ||
        session.id;

      if (!sentPaidWebhookRefs.has(orderRef)) {
        sentPaidWebhookRefs.add(orderRef);

        const amountTotal =
          typeof session.amount_total === "number"
            ? Number((session.amount_total / 100).toFixed(2))
            : 0;

        const paidPayload = {
          order_ref: orderRef,
          customer_name:
            session.metadata?.customer_name ||
            session.customer_details?.name ||
            "Клієнт",
          email:
            session.customer_details?.email ||
            session.customer_email ||
            "",
          phone:
            session.metadata?.phone ||
            session.customer_details?.phone ||
            "",
          delivery_method:
            session.metadata?.delivery_method ||
            "Stripe Checkout",
          payment_method: "stripe",
          status: "paid_stripe",
          stage: "pay",
          total_amount: amountTotal,
          currency: (session.currency || "cad").toUpperCase(),
          isRental: session.metadata?.is_rental === "true",
          type: session.metadata?.is_rental === "true" ? "rental" : "purchase",
        };

        try {
          await sendOrderEmail({
            to: payEmail,
            subject: `[Monroe Archive] 💳 (Pay) Оплату підтверджено: #${orderRef} (CA$${amountTotal.toFixed(2)})`,
            html: renderEmailHtml(paidPayload),
            text: renderEmailText(paidPayload),
          });
          console.log(`✅ Webhook надіслав лист оплати на ${payEmail} для #${orderRef}`);
        } catch (err) {
          sentPaidWebhookRefs.delete(orderRef);
          console.error("❌ Помилка відправки листа з webhook:", err.message);
          return res.status(500).json({ error: "Failed to send paid notification email" });
        }
      }
    }

    return res.status(200).json({ received: true });
  }
);
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
async function handleSendOrderEmail(orderData, res, explicitStage = "") {
  try {
    const stage = normalizeStage({
      stage: explicitStage || orderData.stage || orderData.action || orderData.event,
    });
    const recipientEmail = resolveRecipientEmail({ stage });
    const stageLabel =
      stage === "checkout"
        ? "Proceed to checkout"
        : stage === "pay"
          ? "Pay"
          : "Order";

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
      ? `[Monroe Archive] 📅 (${stageLabel}) Новий запит на ОРЕНДУ: #${orderRef}${totalFormatted} — ${customer}`
      : `[Monroe Archive] 🛍️ (${stageLabel}) Нове замовлення: #${orderRef}${totalFormatted} — ${customer}`;

    const payloadForTemplate = {
      ...orderData,
      stage,
    };

    const htmlBody = renderEmailHtml(payloadForTemplate);
    const textBody = renderEmailText(payloadForTemplate);

    console.log(
      `📩 Відправка email [${stageLabel}] на ${recipientEmail} для замовлення #${orderRef} (${isRental ? "ОРЕНДА" : "КУПІВЛЯ"})...`
    );

    const info = await sendOrderEmail({
      to: recipientEmail,
      subject,
      html: htmlBody,
      text: textBody,
    });

    if (info?.skipped) {
      return res.status(200).json({
        status: "OK",
        skipped: true,
        stage,
        recipient: recipientEmail,
        message: "Email skipped because BREVO_API_KEY is not configured",
      });
    }

    console.log("✅ Email успішно надіслано через Brevo! Message ID:", info?.messageId || "");
    return res.status(200).json({
      status: "OK",
      stage,
      recipient: recipientEmail,
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
  const body = req.body || {};
  const orderData = body.order && typeof body.order === "object" ? body.order : body;
  if (!orderData || typeof orderData !== "object") {
    return res.status(400).json({ error: "No order payload provided" });
  }
  const explicitStage = body.stage || body.action || body.event || "";
  return handleSendOrderEmail(orderData, res, explicitStage);
});

app.post("/send", async (req, res) => {
  console.log("📩 Запит /send отримано");
  const payload = req.body || {};
  const explicitStage = payload.stage || payload.action || payload.event || "";

  if (payload.order || (payload.customer_name && payload.items)) {
    return handleSendOrderEmail(payload.order || payload, res, explicitStage);
  }

  const recipientEmail = resolveRecipientEmail(payload);
  const message = payload.message || "Повідомлення від Monroe Closet Studio";

  try {
    const info = await sendOrderEmail({
      to: recipientEmail,
      subject: "Monroe Closet Studio — Нове повідомлення",
      html: renderEmailHtml(message),
      text: renderEmailText(message),
    });

    console.log("✅ Brevo response:", info?.messageId || "OK");
    return res.status(200).json({
      status: "OK",
      recipient: recipientEmail,
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

server.on("error", (error) => {
  console.error("❌ Server listen error:", error);
  process.exit(1);
});
