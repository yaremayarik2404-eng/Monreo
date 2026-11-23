/**
 * MONROE CLOSET STUDIO — CHECKOUT LOGIC (CANADA & STRIPE)
 * Handles cart synchronization, luxury editorial summary, Canadian shipping & address validation,
 * Express Stripe Checkout API session creation, and Supabase orders storage.
 */

(function () {
  "use strict";

  const CART_KEY = "monroe_studio_cart";
  const PENDING_ORDERS_KEY = "monroe_pending_orders";
  const BACKEND_STRIPE_ENDPOINT = "/api/create-checkout-session";

  // =========================================================================
  // 0. CANADIAN CURRENCY FORMATTING & HELPERS
  // =========================================================================

  function fmt(amount) {
    const num = Number(amount) || 0;
    return `CA$${num.toLocaleString("en-CA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeImageUrl(url) {
    if (!url || typeof url !== "string") return "img/Monreo.png";
    const trimmed = url.trim();
    if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:image\/|img\/)/i.test(trimmed)) {
      return trimmed;
    }
    return "img/Monreo.png";
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (_) {}
  }

  function savePendingOrder(payload) {
    try {
      const raw = localStorage.getItem(PENDING_ORDERS_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(existing) ? existing : [];
      list.unshift(payload);
      localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(list.slice(0, 30)));
    } catch (_) {}
  }

  function syncGlobalCart(cart) {
    if (typeof window.studioCart !== "undefined" && Array.isArray(window.studioCart)) {
      window.studioCart.length = 0;
      cart.forEach((item) => window.studioCart.push(item));
    }
    if (typeof window.renderCartDrawer === "function") {
      window.renderCartDrawer();
    }
  }

  // =========================================================================
  // 1. DOM REFERENCES
  // =========================================================================

  const emptyEl        = document.getElementById("checkout-empty");
  const layoutEl       = document.getElementById("checkout-layout");
  const successEl      = document.getElementById("checkout-success");
  const itemsList      = document.getElementById("checkout-items-list");
  const itemsCount     = document.getElementById("checkout-items-count");
  const subtotalEl     = document.getElementById("checkout-subtotal");
  const totalEl        = document.getElementById("checkout-total");
  const form           = document.getElementById("checkout-form");
  const submitBtn      = document.getElementById("checkout-submit-btn");
  const orderNumEl     = document.getElementById("checkout-order-number");
  const deliverySelect = document.getElementById("checkout-delivery");
  const addressInput   = document.getElementById("checkout-address");
  const addressLabel   = document.getElementById("checkout-address-label");
  const cityInput      = document.getElementById("checkout-city");
  const provinceSelect = document.getElementById("checkout-province");
  const postalInput    = document.getElementById("checkout-postal");
  const postalLabel    = document.getElementById("checkout-postal-label");
  const deliveryCostEl = document.getElementById("checkout-delivery-cost");

  if (!emptyEl || !layoutEl || !successEl || !form || !submitBtn) {
    return;
  }

  let isSubmitting = false;

  // =========================================================================
  // 2. SHIPPING METHOD DYNAMICS (CANADA)
  // =========================================================================

  function updateShippingUI() {
    if (!deliverySelect) return;
    const method = deliverySelect.value;

    if (method === "showroom_pickup") {
      if (addressLabel) addressLabel.innerHTML = "Pickup Location (Toronto Showroom)";
      if (addressInput) {
        addressInput.value = "Monroe Studio Showroom — Queen St W, Toronto, ON";
        addressInput.readOnly = true;
      }
      if (cityInput && !cityInput.value.trim()) cityInput.value = "Toronto";
      if (provinceSelect) provinceSelect.value = "ON";
      if (postalInput) {
        postalInput.value = "M5V 2Z3";
        postalInput.readOnly = true;
      }
      if (deliveryCostEl) deliveryCostEl.textContent = "Complimentary Showroom Pickup";
    } else if (method === "canada_post_xpresspost") {
      if (addressLabel) addressLabel.innerHTML = "Street Address <span class=\"req\">*</span>";
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
        addressInput.placeholder = "120 Queen St W, Suite 4B";
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
        postalInput.placeholder = "M5V 2Z3";
      }
      if (deliveryCostEl) deliveryCostEl.textContent = "CA$35.00 (1–2 Business Days)";
    } else if (method === "international") {
      if (addressLabel) addressLabel.innerHTML = "International Street Address <span class=\"req\">*</span>";
      if (postalLabel) postalLabel.innerHTML = "Postal / Zip Code <span class=\"req\">*</span>";
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
      }
      if (provinceSelect) provinceSelect.value = "OTHER";
      if (deliveryCostEl) deliveryCostEl.textContent = "Calculated at dispatch (DHL Express)";
    } else {
      // Default: canada_post_expedited
      if (addressLabel) addressLabel.innerHTML = "Street Address <span class=\"req\">*</span>";
      if (postalLabel) postalLabel.innerHTML = "Postal Code <span class=\"req\">*</span>";
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
        addressInput.placeholder = "120 Queen St W, Suite 4B";
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
        postalInput.placeholder = "M5V 2Z3";
      }
      if (deliveryCostEl) deliveryCostEl.textContent = "Complimentary on Archival Orders";
    }
  }

  if (deliverySelect) {
    deliverySelect.addEventListener("change", updateShippingUI);
    updateShippingUI();
  }

  // =========================================================================
  // 3. RENDER ORDER SUMMARY
  // =========================================================================

  function render() {
    const cart = getCart();

    if (cart.length === 0) {
      emptyEl.style.display = "block";
      layoutEl.style.display = "none";
      syncGlobalCart(cart);
      return;
    }

    emptyEl.style.display = "none";
    layoutEl.style.display = "grid";

    const totalPieces = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const totalAmount = cart.reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
      0
    );

    if (itemsCount) {
      itemsCount.textContent = `${totalPieces} ${totalPieces === 1 ? "piece" : "pieces"}`;
    }
    if (subtotalEl) subtotalEl.textContent = fmt(totalAmount);
    if (totalEl) totalEl.textContent = fmt(totalAmount);

    if (itemsList) {
      itemsList.innerHTML = cart
        .map((item) => {
          const id = escapeHtml(item.id);
          const brand = escapeHtml(item.brand || "");
          const title = escapeHtml(item.title || "Archival piece");
          const altText = escapeHtml(
            [item.brand, item.title].filter(Boolean).join(" ") || "Archival piece"
          );
          const imgSrc = escapeHtml(sanitizeImageUrl(item.image));
          const qty = Math.max(1, Number(item.quantity) || 1);
          const unitPrice = Number(item.price) || 0;
          const lineTotal = fmt(unitPrice * qty);

          return `
            <div class="checkout-item" data-id="${id}">
              <img
                src="${imgSrc}"
                alt="${altText}"
                class="checkout-item-img"
                loading="lazy"
                onerror="this.onerror=null;this.src='img/Monreo.png';"
              >
              <div class="checkout-item-info">
                ${brand ? `<span class="checkout-item-brand">${brand}</span>` : ""}
                <span class="checkout-item-title">${title}</span>
                <span class="checkout-item-unit-price">${fmt(unitPrice)} each</span>
                <div class="checkout-item-actions">
                  <div class="checkout-stepper">
                    <button type="button" data-action="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
                    <span class="checkout-stepper-val">${qty}</span>
                    <button type="button" data-action="inc" data-id="${id}" aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" class="checkout-item-remove-btn" data-action="remove" data-id="${id}">Remove</button>
                </div>
              </div>
              <span class="checkout-item-price">${lineTotal}</span>
            </div>
          `;
        })
        .join("");
    }

    syncGlobalCart(cart);
  }

  // =========================================================================
  // 4. ITEM QUANTITY / REMOVAL ACTIONS
  // =========================================================================

  function updateQuantity(id, delta) {
    const cart = getCart();
    const idx = cart.findIndex((i) => String(i.id) === String(id));
    if (idx < 0) return;

    const nextQty = (Number(cart[idx].quantity) || 1) + delta;
    if (nextQty <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = nextQty;
    }

    saveCart(cart);
    render();
  }

  function removeItem(id) {
    const cart = getCart().filter((i) => String(i.id) !== String(id));
    saveCart(cart);
    render();
  }

  if (itemsList) {
    itemsList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!id) return;

      if (action === "dec") updateQuantity(id, -1);
      else if (action === "inc") updateQuantity(id, 1);
      else if (action === "remove") removeItem(id);
    });
  }

  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) {
      render();
    }
  });

  // =========================================================================
  // 5. VALIDATION (CANADA)
  // =========================================================================

  function showFormAlert(message) {
    let alertEl = document.getElementById("checkout-submit-alert");
    if (!message) {
      if (alertEl) alertEl.remove();
      return;
    }
    if (!alertEl) {
      alertEl = document.createElement("div");
      alertEl.id = "checkout-submit-alert";
      alertEl.setAttribute("role", "alert");
      submitBtn.parentElement.insertBefore(alertEl, submitBtn);
    }
    alertEl.textContent = message;
    alertEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearErrors() {
    showFormAlert("");
    form.querySelectorAll(".field-error").forEach((el) => el.classList.remove("field-error"));
    form.querySelectorAll(".field-error-msg").forEach((el) => el.remove());
  }

  function showFieldError(input, msg) {
    if (!input) return;
    input.classList.add("field-error");
    const span = document.createElement("span");
    span.className = "field-error-msg";
    span.textContent = msg;
    input.parentElement.appendChild(span);
  }

  function isValidPhone(rawPhone) {
    if (!rawPhone) return false;
    const digitsOnly = rawPhone.replace(/\D/g, "");
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }

  function isValidCanadianPostal(rawPostal) {
    if (!rawPostal) return false;
    // Standard Canadian Postal Code format: A1A 1A1
    const cleaned = rawPostal.trim().toUpperCase().replace(/\s+/, "");
    return /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVXY]\d$/.test(cleaned);
  }

  function isValidEmail(rawEmail) {
    if (!rawEmail) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail.trim());
  }

  function validate() {
    clearErrors();
    let ok = true;
    let firstInvalid = null;

    const nameInput    = document.getElementById("checkout-name");
    const phoneInput   = document.getElementById("checkout-phone");
    const emailInput   = document.getElementById("checkout-email");
    const addressInp   = document.getElementById("checkout-address");
    const cityInp      = document.getElementById("checkout-city");
    const postalInp    = document.getElementById("checkout-postal");
    const deliveryType = deliverySelect ? deliverySelect.value : "canada_post_expedited";

    // 1. Full Name
    const nameVal = nameInput ? nameInput.value.trim() : "";
    if (!nameVal || nameVal.length < 2) {
      showFieldError(nameInput, "Please enter your full name");
      if (!firstInvalid) firstInvalid = nameInput;
      ok = false;
    }

    // 2. Phone
    const phoneVal = phoneInput ? phoneInput.value.trim() : "";
    if (!phoneVal) {
      showFieldError(phoneInput, "Please provide a contact phone number");
      if (!firstInvalid) firstInvalid = phoneInput;
      ok = false;
    } else if (!isValidPhone(phoneVal)) {
      showFieldError(phoneInput, "Please enter a valid phone number (e.g. +1 416 555 0192)");
      if (!firstInvalid) firstInvalid = phoneInput;
      ok = false;
    }

    // 3. Email
    const emailVal = emailInput ? emailInput.value.trim() : "";
    if (!emailVal || !isValidEmail(emailVal)) {
      showFieldError(emailInput, "Please provide a valid email address for order confirmation");
      if (!firstInvalid) firstInvalid = emailInput;
      ok = false;
    }

    // 4. Shipping Address & Postal Code (if not showroom pickup)
    if (deliveryType !== "showroom_pickup") {
      const addressVal = addressInp ? addressInp.value.trim() : "";
      if (!addressVal || addressVal.length < 3) {
        showFieldError(addressInp, "Please enter a complete street address");
        if (!firstInvalid) firstInvalid = addressInp;
        ok = false;
      }

      const cityVal = cityInp ? cityInp.value.trim() : "";
      if (!cityVal || cityVal.length < 2) {
        showFieldError(cityInp, "Please enter your city");
        if (!firstInvalid) firstInvalid = cityInp;
        ok = false;
      }

      const postalVal = postalInp ? postalInp.value.trim() : "";
      if (!postalVal) {
        showFieldError(postalInp, "Please enter your postal code");
        if (!firstInvalid) firstInvalid = postalInp;
        ok = false;
      } else if (deliveryType !== "international" && !isValidCanadianPostal(postalVal)) {
        showFieldError(postalInp, "Please check the Canadian postal code format (e.g. M5V 2Z3)");
        if (!firstInvalid) firstInvalid = postalInp;
        ok = false;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return ok;
  }

  form.addEventListener("input", (e) => {
    if (e.target.classList.contains("field-error")) {
      e.target.classList.remove("field-error");
      const msg = e.target.parentElement.querySelector(".field-error-msg");
      if (msg) msg.remove();
    }
  });

  // =========================================================================
  // 6. ORDER REFERENCE & UI STATE
  // =========================================================================

  function generateOrderReference() {
    const now = new Date();
    const datePart =
      String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `MCS-CA-${datePart}-${rand}`;
  }

  function setLoadingState(loading, label = "Connecting to Stripe…") {
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoad = submitBtn.querySelector(".btn-loading");
    if (btnText) btnText.style.display = loading ? "none" : "inline";
    if (btnLoad) {
      btnLoad.style.display = loading ? "inline-flex" : "none";
      if (label) {
        btnLoad.lastChild.textContent = ` ${label}`;
      }
    }
    submitBtn.disabled = loading;
  }

  function showSuccessScreen(confirmedLabel) {
    layoutEl.style.display = "none";
    emptyEl.style.display = "none";
    const pageHeader = document.querySelector(".checkout-page-header");
    if (pageHeader) pageHeader.style.display = "none";
    if (orderNumEl) orderNumEl.textContent = confirmedLabel;
    successEl.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =========================================================================
  // 7. STRIPE CHECKOUT API
  // =========================================================================

  function isStripePayment(method) {
    return method === "stripe" || method === "card" || method === "card_stripe";
  }

  async function createStripeSession(orderPayload, orderRef) {
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/[^/]*$/, "");
    const baseUrl = `${origin}${pathname}`;

    const res = await fetch(BACKEND_STRIPE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderPayload.items,
        customer_email: orderPayload.email,
        order_ref: orderRef,
        currency: "cad",
        success_url: `${baseUrl}checkout.html?stripe_status=success&ref=${encodeURIComponent(orderRef)}`,
        cancel_url: `${baseUrl}checkout.html?stripe_status=cancelled&ref=${encodeURIComponent(orderRef)}`
      })
    });

    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Could not initiate Stripe Checkout session.");
    }

    return data.url;
  }

  // =========================================================================
  // 8. ORDER SUBMISSION
  // =========================================================================

  async function submitOrder() {
    if (isSubmitting) return;
    if (!validate()) return;

    const cart = getCart();
    if (cart.length === 0) {
      render();
      return;
    }

    const name           = (document.getElementById("checkout-name")?.value || "").trim().slice(0, 120);
    const phone          = (document.getElementById("checkout-phone")?.value || "").trim().slice(0, 30);
    const email          = (document.getElementById("checkout-email")?.value || "").trim().slice(0, 160);
    const socialHandle   = (document.getElementById("checkout-social")?.value || "").trim().slice(0, 100);
    const deliveryMethod = deliverySelect?.value || "canada_post_expedited";
    const address        = (document.getElementById("checkout-address")?.value || "").trim().slice(0, 240);
    const city           = (document.getElementById("checkout-city")?.value || "").trim().slice(0, 100);
    const province       = provinceSelect?.value || "ON";
    const postalCode     = (document.getElementById("checkout-postal")?.value || "").trim().toUpperCase().slice(0, 16);
    const paymentMethod  = document.getElementById("checkout-payment")?.value || "stripe";
    const notes          = (document.getElementById("checkout-notes")?.value || "").trim().slice(0, 500);

    const totalAmount = cart.reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
      0
    );
    const orderRef = generateOrderReference();
    const useStripe = isStripePayment(paymentMethod);

    const orderItems = cart.map((i) => ({
      id: i.id,
      brand: i.brand || "",
      title: i.title || "",
      price: Number(i.price) || 0,
      quantity: Math.max(1, Number(i.quantity) || 1),
      image: sanitizeImageUrl(i.image)
    }));

    const fullShippingAddress = [
      address,
      city,
      province,
      postalCode,
      "Canada"
    ]
      .filter(Boolean)
      .join(", ");

    const combinedNotes = [
      `Ref: ${orderRef}`,
      `Shipping: ${deliveryMethod}`,
      notes
    ]
      .filter(Boolean)
      .join(" | ");

    const orderPayload = {
      customer_name: name,
      phone: phone,
      email: email || null,
      social_handle: socialHandle || null,
      delivery_method: deliveryMethod,
      city: city || null,
      branch_or_address: fullShippingAddress || null,
      payment_method: paymentMethod,
      notes: combinedNotes || null,
      items: orderItems,
      total_amount: totalAmount,
      currency: "CAD",
      status: useStripe ? "pending_payment" : "new"
    };

    isSubmitting = true;
    setLoadingState(true, useStripe ? "Connecting to Stripe…" : "Placing order…");

    try {
      // 1. Try to record in Supabase orders table (or fallback to local pending orders)
      if (typeof window.supabaseClient !== "undefined" && window.supabaseClient) {
        try {
          await window.supabaseClient.from("orders").insert([orderPayload]);
        } catch (dbErr) {
          console.warn("Supabase insert warning:", dbErr);
          savePendingOrder({ ref: orderRef, payload: orderPayload });
        }
      } else {
        savePendingOrder({ ref: orderRef, payload: orderPayload });
      }

      // 2. If Stripe chosen, initiate Stripe Checkout session
      if (useStripe) {
        try {
          const checkoutUrl = await createStripeSession(orderPayload, orderRef);
          saveCart([]);
          syncGlobalCart([]);
          window.location.href = checkoutUrl;
          return;
        } catch (stripeErr) {
          console.error("Stripe error:", stripeErr);
          showFormAlert(
            `Stripe Checkout could not be opened (${stripeErr.message}). Your order details (${orderRef}) have been preserved — our studio concierge will contact you via email (${email}) or phone (${phone}) to arrange secure payment.`
          );
          savePendingOrder({ ref: orderRef, payload: orderPayload });
          return;
        }
      }

      // 3. For Interac e-Transfer or Studio Concierge
      saveCart([]);
      syncGlobalCart([]);
      showSuccessScreen(`#${orderRef}`);
    } catch (err) {
      console.error("Submission error:", err);
      savePendingOrder({ ref: orderRef, payload: orderPayload });
      showFormAlert(
        `An unexpected error occurred (${orderRef}). Your order details were saved — please reach out to @monroecloset.studio or info@monroecloset.studio.`
      );
    } finally {
      isSubmitting = false;
      setLoadingState(false);
    }
  }

  // =========================================================================
  // 9. STRIPE RETURN HANDLER & EVENT LISTENERS
  // =========================================================================

  function handleStripeReturn() {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("stripe_status");
    const ref = params.get("ref");

    if (stripeStatus === "success") {
      saveCart([]);
      syncGlobalCart([]);
      showSuccessScreen(ref ? `#${ref}` : "CONFIRMED");
      return true;
    }

    if (stripeStatus === "cancelled") {
      render();
      showFormAlert(
        "Stripe payment was cancelled. Your archival bag has been preserved — you can try again or select Interac e-Transfer."
      );
      return true;
    }

    return false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitOrder();
  });

  const cartDrawerCheckoutBtn = document.getElementById("checkout-btn");
  if (cartDrawerCheckoutBtn) {
    cartDrawerCheckoutBtn.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      if (typeof window.closeCartDrawer === "function") {
        window.closeCartDrawer();
      }
      const cart = getCart();
      if (cart.length > 0) {
        render();
        form.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // =========================================================================
  // 10. INITIALIZATION
  // =========================================================================

  if (!handleStripeReturn()) {
    render();
  }
})();
