require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 3000;
const app = express();
const path = require("path");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const emailTemplate = require("./email")

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isStripeConfigured = Boolean(
  stripeSecretKey &&
  !stripeSecretKey.includes("replace_with_your_stripe_secret_key")
);
const stripe = isStripeConfigured ? require("stripe")(stripeSecretKey) : null;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Multi-page clean routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/shop", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "shop.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/rental", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "rental.html"));
});

app.get("/styling", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "styling.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

// =============================================================================
// STRIPE CHECKOUT SESSION API (Canada - CAD)
// =============================================================================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe is not configured yet. Please add your valid STRIPE_SECRET_KEY to the .env file."
      });
    }

    const { items, customer_email, order_ref, success_url, cancel_url } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const line_items = items.map((item) => {
      // Amount in Canadian cents (CAD)
      const unitAmount = Math.max(50, Math.round((Number(item.price) || 0) * 100));
      return {
        price_data: {
          currency: "cad",
          product_data: {
            name: `${item.brand ? item.brand + " — " : ""}${item.title || "Archival piece"}`,
            images: item.image && /^https?:\/\//i.test(item.image) ? [item.image] : []
          },
          unit_amount: unitAmount
        },
        quantity: Math.max(1, Number(item.quantity) || 1)
      };
    });

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host") || `localhost:${port}`;
    const defaultBaseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      allowed_payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customer_email || undefined,
      client_reference_id: order_ref,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["CA", "US", "GB", "UA", "FR", "DE", "IT", "ES"]
      },
      success_url:
        success_url ||
        `${defaultBaseUrl}/checkout.html?stripe_status=success&ref=${encodeURIComponent(order_ref || "")}`,
      cancel_url:
        cancel_url ||
        `${defaultBaseUrl}/checkout.html?stripe_status=cancelled&ref=${encodeURIComponent(order_ref || "")}`
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("Stripe Session Error:", err);
    res.status(500).json({
      error: err.message || "Failed to create Stripe Checkout session"
    });
  }
});

// Check Stripe status endpoint
app.get("/api/stripe-config", (req, res) => {
  res.json({
    configured: Boolean(stripe),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  });
});


// =============================================================================
// GMAIL NOTIFICATIONS (Nodemailer)
// =============================================================================
const ownerEmail = (process.env.MAIN_USER || "yaremayarik2404@gmail.com").trim();
const gmailPassword = (process.env.MAIN_PASSWORD || "").trim();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ownerEmail,
    pass: gmailPassword
  }
});

transporter.verify()
  .then(() => console.log("✅ Gmail SMTP підключено:", ownerEmail))
  .catch((err) => console.error("❌ Помилка підключення Gmail SMTP:", err.message));

// Endpoint to send luxury order / rental notifications
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
    const totalFormatted = totalAmount !== "" ? ` (CA$${Number(totalAmount).toFixed(2)})` : "";

    const subject = isRental
      ? `[Monroe Archive] 📅 Новий запит на ОРЕНДУ: #${orderRef}${totalFormatted} — ${customer}`
      : `[Monroe Archive] 🛍️ Нове замовлення: #${orderRef}${totalFormatted} — ${customer}`;

    const mailOptions = {
      from: `"Monroe Closet Studio" <${ownerEmail}>`,
      to: "yaremayarik2404@gmail.com",
      subject: subject,
      text: emailTemplate.generateOrderText ? emailTemplate.generateOrderText(orderData) : JSON.stringify(orderData, null, 2),
      html: emailTemplate(orderData)
    };

    console.log(`📩 Відправка email для замовлення #${orderRef} (${isRental ? "ОРЕНДА" : "КУПІВЛЯ"})...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email успішно надіслано на Gmail! Message ID:", info.messageId);

    return res.status(200).json({
      status: "OK",
      message: "Order notification email successfully sent",
      messageId: info.messageId
    });
  } catch (error) {
    console.error("❌ Помилка при відправці email:", error.message);
    return res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
}

app.post("/api/send-order-email", async (req, res) => {
  const orderData = req.body.order || req.body;
  if (!orderData || typeof orderData !== "object") {
    return res.status(400).json({ error: "No order payload provided" });
  }
  return handleSendOrderEmail(orderData, res);
});

app.post("/send", async (req, res) => {
  console.log("📩 Запит /send отримано");
  const payload = req.body;

  // If order object is passed to /send
  if (payload.order || (payload.customer_name && payload.items)) {
    return handleSendOrderEmail(payload.order || payload, res);
  }

  // Fallback for simple message string
  const message = payload.message || "Повідомлення від Monroe Closet Studio";
  const mailOptions = {
    from: `"Monroe Closet Studio" <${ownerEmail}>`,
    to: "yaremayarik2404@gmail.com",
    subject: "Monroe Closet Studio — Нове повідомлення",
    text: typeof message === "string" ? message : JSON.stringify(message, null, 2),
    html: emailTemplate(message)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ SMTP response:", info.response);
    res.status(200).json({
      status: "OK",
      message: "Email accepted by SMTP server",
      messageId: info.messageId
    });
  } catch (error) {
    console.error("❌ Помилка:", error.message);
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
