/**
 * MONROE CLOSET STUDIO — CHECKOUT & ARCHIVE RENTAL LOGIC (CANADA & STRIPE)
 * Handles:
 * 1. Standard Bag Checkout (multi-item archive purchases)
 * 2. Archive Rental Checkout (?mode=rental&productId=...) with date selection, duration calculation, and rental purpose
 * 3. Instant luxury email notifications to studio owner via Gmail SMTP (/api/send-order-email)
 * 4. Stripe Checkout Session creation OR Cash on Delivery direct confirmation + Supabase storage
 */

(function () {
  "use strict";

  const CART_KEY = "monroe_studio_cart";
  const PENDING_ORDERS_KEY = "monroe_pending_orders";
  const BACKEND_STRIPE_ENDPOINT = "/api/create-checkout-session";
  const BACKEND_EMAIL_ENDPOINT = "/api/send-order-email";

  const urlParams = new URLSearchParams(window.location.search);
  const isRentalMode = urlParams.get("mode") === "rental";
  const rentalProductId = urlParams.get("productId") || urlParams.get("id");
  

  let rentalPiece = null;
  let isSubmitting = false;

  // =========================================================================
  // 0. HELPERS & FORMATTING
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

  function getLatestPendingOrder(ref) {
    try {
      const raw = localStorage.getItem(PENDING_ORDERS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return null;
      if (ref) return list.find((o) => o.ref === ref) || list[0] || null;
      return list[0] || null;
    } catch (_) {
      return null;
    }
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

  function formatDateIso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseLocalDate(isoStr) {
    if (!isoStr || typeof isoStr !== "string") return null;
    const parts = isoStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }

  function getShippingFee(method) {
    if (method === "white_glove_courier") return 25;
    if (method === "canada_post_xpresspost" || method === "canada_post_returnable") return 35;
    return 0;
  }

  function isStripePayment(method) {
    return method === "stripe" || method === "card" || method === "card_stripe";
  }

  function isCashOnDelivery(method) {
    return method === "cash_on_delivery" || method === "cod";
  }

  // =========================================================================
  // 1. DOM REFERENCES
  // =========================================================================

  const emptyEl          = document.getElementById("checkout-empty");
  const layoutEl         = document.getElementById("checkout-layout");
  const successEl        = document.getElementById("checkout-success");
  const itemsList        = document.getElementById("checkout-items-list");
  const itemsCount       = document.getElementById("checkout-items-count");
  const subtotalEl       = document.getElementById("checkout-subtotal");
  const totalEl          = document.getElementById("checkout-total");
  const form             = document.getElementById("checkout-form");
  const submitBtn        = document.getElementById("checkout-submit-btn");
  const submitBtnText    = document.getElementById("checkout-submit-btn-text") || submitBtn?.querySelector(".btn-text");
  const orderNumEl       = document.getElementById("checkout-order-number");
  const deliverySelect   = document.getElementById("checkout-delivery");
  const paymentSelect    = document.getElementById("checkout-payment");
  const addressInput     = document.getElementById("checkout-address");
  const addressLabel     = document.getElementById("checkout-address-label");
  const cityInput        = document.getElementById("checkout-city");
  const provinceSelect   = document.getElementById("checkout-province");
  const postalInput      = document.getElementById("checkout-postal");
  const postalLabel      = document.getElementById("checkout-postal-label");
  const deliveryCostEl   = document.getElementById("checkout-delivery-cost");

  // Rental specific elements
  const rentalBanner        = document.getElementById("checkout-rental-banner");
  const rentalOptionsBox    = document.getElementById("checkout-rental-options");
  const rentalStartDateInp  = document.getElementById("rental-start-date");
  const rentalEndDateInp    = document.getElementById("rental-end-date");
  const rentalDurationPill  = document.getElementById("rental-duration-badge");
  const rentalBreakdownEl   = document.getElementById("rental-rate-breakdown");
  const rentalPurposeGroup  = document.getElementById("field-rental-purpose-group");
  const rentalPurposeSelect = document.getElementById("checkout-rental-purpose");

  // Header and texts
  const pageKicker       = document.getElementById("checkout-kicker");
  const pageTitle        = document.getElementById("checkout-title");
  const crumbParent      = document.getElementById("checkout-crumb-parent");
  const crumbActive      = document.getElementById("checkout-crumb-active");
  const sectionTitle     = document.getElementById("checkout-section-title");
  const formTitle        = document.getElementById("checkout-form-title");
  const formSubtitle     = document.getElementById("checkout-form-subtitle");
  const notesLabel       = document.getElementById("checkout-notes-label");
  const disclaimerEl     = document.getElementById("checkout-disclaimer");

  if (!emptyEl || !layoutEl || !successEl || !form || !submitBtn) {
    return;
  }

  // =========================================================================
  // 2. PAYMENT METHOD UI SYNC (STRIPE vs CASH ON DELIVERY)
  // =========================================================================

  function updatePaymentUI() {
    const method = paymentSelect ? paymentSelect.value : "stripe";
    const cod = isCashOnDelivery(method);

    if (submitBtnText) {
      if (isRentalMode) {
        submitBtnText.textContent = cod
          ? "Confirm Rental (Cash on Delivery)"
          : "Confirm Rental Reservation";
      } else {
        submitBtnText.textContent = cod
          ? "Place Order (Cash on Delivery)"
          : "Proceed to Checkout";
      }
    }

    if (formSubtitle) {
      if (isRentalMode) {
        formSubtitle.textContent = cod
          ? "Reserve this archival piece now and pay upon delivery or showroom fitting."
          : "Reserve this archival piece for private fitting, production, or direct delivery.";
      } else {
        formSubtitle.textContent = cod
          ? "Confirm your order now and pay in cash upon delivery or showroom pickup."
          : "Complete your order with secure Stripe checkout or concierge private arrangement.";
      }
    }
  }

  if (paymentSelect) {
    paymentSelect.addEventListener("change", () => {
      showFormAlert("");
      updatePaymentUI();
    });
  }

  // =========================================================================
  // 3. RENTAL DATES & PRICING CALCULATION
  // =========================================================================

  function initRentalDatePickers() {
    if (!rentalStartDateInp || !rentalEndDateInp) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const fourDaysLater = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 3);

    rentalStartDateInp.min = formatDateIso(today);
    rentalStartDateInp.value = formatDateIso(tomorrow);

    rentalEndDateInp.min = formatDateIso(tomorrow);
    rentalEndDateInp.value = formatDateIso(fourDaysLater);

    rentalStartDateInp.addEventListener("change", () => {
      const startVal = rentalStartDateInp.value;
      const dStart = parseLocalDate(startVal);
      if (!dStart) return;

      rentalEndDateInp.min = startVal;
      const dEnd = parseLocalDate(rentalEndDateInp.value);

      if (!dEnd || dEnd <= dStart) {
        const nextEnd = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate() + 3);
        rentalEndDateInp.value = formatDateIso(nextEnd);
      }
      recalculateTotals();
    });

    rentalEndDateInp.addEventListener("change", () => {
      recalculateTotals();
    });
  }

  function getRentalDurationDays() {
    if (!rentalStartDateInp || !rentalEndDateInp) return 3;
    const d1 = parseLocalDate(rentalStartDateInp.value);
    const d2 = parseLocalDate(rentalEndDateInp.value);
    if (!d1 || !d2) return 3;

    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  function getRentalPricing(piece) {
    if (!piece) return { total: 0, basePrice: 0, extraDays: 0, extraCost: 0, dailyExtraRate: 25, days: 3 };

    const days = getRentalDurationDays();
    const basePrice = piece.rentalPrice
      ? Number(piece.rentalPrice)
      : Math.max(120, Math.round((Number(piece.price) || 400) * 0.25));

    const dailyExtraRate = Math.max(25, Math.round(basePrice / 3));

    let total = basePrice;
    let extraDays = 0;
    let extraCost = 0;

    if (days > 3) {
      extraDays = days - 3;
      extraCost = extraDays * dailyExtraRate;
      total = basePrice + extraCost;
    }

    return { total, basePrice, extraDays, extraCost, dailyExtraRate, days };
  }

  function getBaseSubtotal() {
    if (isRentalMode) {
      const { total, basePrice, extraDays, extraCost, dailyExtraRate, days } = getRentalPricing(rentalPiece);

      if (rentalDurationPill) {
        rentalDurationPill.textContent = `${days} ${days === 1 ? "Day" : "Days"} Rental`;
      }
      if (rentalBreakdownEl) {
        if (days <= 3) {
          rentalBreakdownEl.textContent = `3-Day baseline rate: ${fmt(basePrice)} (Couture care included)`;
        } else {
          rentalBreakdownEl.textContent = `Baseline (3 days): ${fmt(basePrice)} + ${extraDays} extra days @ ${fmt(dailyExtraRate)}/day (${fmt(extraCost)})`;
        }
      }
      const liveItemPrice = document.getElementById("rental-item-live-price");
      if (liveItemPrice) liveItemPrice.textContent = fmt(total);

      return total;
    }

    const cart = getCart();
    return cart.reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
      0
    );
  }

  function recalculateTotals() {
    const subtotal = getBaseSubtotal();
    const method = deliverySelect ? deliverySelect.value : "";
    const shippingFee = getShippingFee(method);

    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (totalEl) totalEl.textContent = fmt(subtotal + shippingFee);
  }

  // =========================================================================
  // 4. SHIPPING & FULFILLMENT DYNAMICS
  // =========================================================================

  function updateShippingUI() {
    if (!deliverySelect) {
      recalculateTotals();
      return;
    }

    const method = deliverySelect.value;

    if (method === "showroom_pickup" || method === "showroom_fitting") {
      if (addressLabel) addressLabel.innerHTML = "Studio Fitting & Collection Location";
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
      if (deliveryCostEl) deliveryCostEl.textContent = "Complimentary Studio Showroom Collection";
    } else if (method === "white_glove_courier") {
      if (addressLabel) addressLabel.innerHTML = 'Toronto / GTA Delivery Address <span class="req">*</span>';
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
      }
      if (deliveryCostEl) deliveryCostEl.textContent = "CA$25.00 (Same-Day White Glove Hand-Delivery)";
    } else if (method === "canada_post_xpresspost") {
      if (addressLabel) addressLabel.innerHTML = 'Street Address <span class="req">*</span>';
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
      }
      if (deliveryCostEl) deliveryCostEl.textContent = "CA$35.00 (1–2 Business Days Expedited)";
    } else if (method === "canada_post_returnable") {
      if (addressLabel) addressLabel.innerHTML = 'Street Address <span class="req">*</span>';
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
      }
      if (deliveryCostEl) deliveryCostEl.textContent = "CA$35.00 (Tracked Expedited + Prepaid Return Label)";
    } else if (method === "international") {
      if (addressLabel) addressLabel.innerHTML = 'International Street Address <span class="req">*</span>';
      if (postalLabel) postalLabel.innerHTML = 'Postal / Zip Code <span class="req">*</span>';
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
      if (addressLabel) addressLabel.innerHTML = 'Street Address <span class="req">*</span>';
      if (postalLabel) postalLabel.innerHTML = 'Postal Code <span class="req">*</span>';
      if (addressInput && addressInput.readOnly) {
        addressInput.value = "";
        addressInput.readOnly = false;
      }
      if (postalInput && postalInput.readOnly) {
        postalInput.value = "";
        postalInput.readOnly = false;
      }
      if (deliveryCostEl) {
        deliveryCostEl.textContent = isRentalMode
          ? "Tracked returnable shipping with prepaid return label"
          : "Complimentary on Archival Orders";
      }
    }

    recalculateTotals();
  }

  if (deliverySelect) {
    deliverySelect.addEventListener("change", updateShippingUI);
  }

  function setupDeliveryOptionsForMode() {
    if (!deliverySelect) return;
    if (isRentalMode) {
      deliverySelect.innerHTML = `
        <option value="showroom_fitting" selected>Studio Showroom Fitting & Collection (Toronto, ON — Complimentary)</option>
        <option value="white_glove_courier">White Glove Toronto / GTA Courier (+ CA$25.00)</option>
        <option value="canada_post_returnable">Canada Post Tracked Expedited with Prepaid Return Label (+ CA$35.00)</option>
      `;
    } else {
      deliverySelect.innerHTML = `
        <option value="canada_post_expedited" selected>Canada Post Expedited Parcel (3–5 business days)</option>
        <option value="canada_post_xpresspost">Canada Post Xpresspost (1–2 business days — + CA$35.00)</option>
        <option value="showroom_pickup">Studio Showroom Pickup (Toronto, ON — By Appointment)</option>
        <option value="international">Worldwide Express (DHL / FedEx International)</option>
      `;
    }
    updateShippingUI();
  }

  // =========================================================================
  // 5. PRODUCT FETCHING & RENDER
  // =========================================================================

  async function resolveRentalProduct(id) {
    if (!id) return null;

    if (typeof window.getProductById === "function") {
      const p = window.getProductById(id);
      if (p) return p;
    }

    if (typeof window.fetchProductsFromSupabase === "function") {
      try {
        const live = await window.fetchProductsFromSupabase();
        if (Array.isArray(live)) {
          const found = live.find((it) => String(it.id) === String(id));
          if (found) return found;
        }
      } catch (_) {}
    }

    if (typeof window.getStudioProducts === "function") {
      const prods = window.getStudioProducts();
      if (Array.isArray(prods)) {
        const found = prods.find((it) => String(it.id) === String(id));
        if (found) return found;
      }
    }

    return null;
  }

  async function renderRentalView() {
    setupDeliveryOptionsForMode();
    initRentalDatePickers();

    if (pageKicker) pageKicker.textContent = "ARCHIVE RENTAL — MONROE STUDIO";
    if (pageTitle) pageTitle.textContent = "Rental Reservation & Fitting";
    if (crumbParent) {
      crumbParent.textContent = "Archive Rental";
      crumbParent.href = "rental.html";
    }
    if (crumbActive) crumbActive.textContent = "Rental Booking";
    if (sectionTitle) sectionTitle.textContent = "Archival Piece for Rental";
    if (formTitle) formTitle.textContent = "Reservation & Fitting Details";
    if (notesLabel) notesLabel.textContent = "Rental Notes, Height/Measurements & Event Details";
    if (disclaimerEl) disclaimerEl.textContent = "All archival rentals include complimentary couture preservation care. Security deposit hold verified prior to dispatch.";

    if (rentalBanner) rentalBanner.style.display = "flex";
    if (rentalOptionsBox) rentalOptionsBox.style.display = "block";
    if (rentalPurposeGroup) rentalPurposeGroup.style.display = "block";

    rentalPiece = await resolveRentalProduct(rentalProductId);

    if (!rentalPiece) {
      rentalPiece = {
        id: rentalProductId || "rental_archive_item",
        brand: "Monroe Archive",
        title: "Selected Archival Piece",
        rentalPrice: 180,
        price: 750,
        images: ["img/Monreo.png"],
        rentalAvailable: true
      };
    }

    emptyEl.style.display = "none";
    layoutEl.style.display = "grid";

    if (itemsCount) itemsCount.textContent = "1 archival piece";

    const imgSrc = escapeHtml(sanitizeImageUrl((rentalPiece.images && rentalPiece.images[0]) || "img/Monreo.png"));
    const brand = escapeHtml(rentalPiece.brand || "Monroe Archive");
    const title = escapeHtml(rentalPiece.title || "Archival piece");
    const baseRentalFee = rentalPiece.rentalPrice || Math.max(120, Math.round((Number(rentalPiece.price) || 400) * 0.25));

    if (itemsList) {
      itemsList.innerHTML = `
        <div class="checkout-item checkout-rental-item" data-id="${escapeHtml(rentalPiece.id)}">
          <img
            src="${imgSrc}"
            alt="${brand} ${title}"
            class="checkout-item-img"
            loading="lazy"
            onerror="this.onerror=null;this.src='img/Monreo.png';"
          >
          <div class="checkout-item-info">
            <span class="checkout-item-brand">${brand}</span>
            <span class="checkout-item-title">${title} <span class="checkout-item-badge-rent">Rental</span></span>
            <span class="checkout-item-unit-price">Baseline 3-day rental: ${fmt(baseRentalFee)}</span>
            <div class="checkout-item-actions" style="margin-top:8px;">
              <span style="font-size:0.75rem; color:#888;">Unique archival edition • Hand-inspected</span>
            </div>
          </div>
          <span class="checkout-item-price" id="rental-item-live-price">${fmt(baseRentalFee)}</span>
        </div>
      `;
    }

    updatePaymentUI();
    recalculateTotals();
  }

  function renderStandardBagView() {
    setupDeliveryOptionsForMode();

    if (rentalBanner) rentalBanner.style.display = "none";
    if (rentalOptionsBox) rentalOptionsBox.style.display = "none";
    if (rentalPurposeGroup) rentalPurposeGroup.style.display = "none";

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

    if (itemsCount) {
      itemsCount.textContent = `${totalPieces} ${totalPieces === 1 ? "piece" : "pieces"}`;
    }

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

    updatePaymentUI();
    recalculateTotals();
    syncGlobalCart(cart);
  }

  function render() {
    if (isRentalMode) {
      renderRentalView();
    } else {
      renderStandardBagView();
    }
  }

  // =========================================================================
  // 6. QUANTITY / REMOVAL ACTIONS (SHOPPING BAG)
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
    if (e.key === CART_KEY && !isRentalMode) {
      render();
    }
  });

  // =========================================================================
  // 7. FORM VALIDATION
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
    const cleaned = rawPostal.trim().toUpperCase().replace(/\s+/g, "");
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

    if (isRentalMode) {
      const sVal = rentalStartDateInp?.value;
      const eVal = rentalEndDateInp?.value;
      const dStart = parseLocalDate(sVal);
      const dEnd = parseLocalDate(eVal);

      if (!dStart) {
        showFieldError(rentalStartDateInp, "Please select rental start date");
        if (!firstInvalid) firstInvalid = rentalStartDateInp;
        ok = false;
      }
      if (!dEnd) {
        showFieldError(rentalEndDateInp, "Please select rental return date");
        if (!firstInvalid) firstInvalid = rentalEndDateInp;
        ok = false;
      } else if (dStart && dEnd < dStart) {
        showFieldError(rentalEndDateInp, "Return date must be on or after start date");
        if (!firstInvalid) firstInvalid = rentalEndDateInp;
        ok = false;
      }
    }

    if (nameInput) {
      const nameVal = nameInput.value.trim();
      if (!nameVal || nameVal.length < 2) {
        showFieldError(nameInput, "Please enter your full name");
        if (!firstInvalid) firstInvalid = nameInput;
        ok = false;
      }
    }

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

    const emailVal = emailInput ? emailInput.value.trim() : "";
    if (!emailVal || !isValidEmail(emailVal)) {
      showFieldError(emailInput, "Please provide a valid email address for order confirmation");
      if (!firstInvalid) firstInvalid = emailInput;
      ok = false;
    }

    const isShowroom = deliveryType === "showroom_pickup" || deliveryType === "showroom_fitting";
    if (!isShowroom && addressInp && cityInp && postalInp) {
      const addressVal = addressInp.value.trim();
      if (!addressVal || addressVal.length < 3) {
        showFieldError(addressInp, "Please enter a complete street address");
        if (!firstInvalid) firstInvalid = addressInp;
        ok = false;
      }

      const cityVal = cityInp.value.trim();
      if (!cityVal || cityVal.length < 2) {
        showFieldError(cityInp, "Please enter your city");
        if (!firstInvalid) firstInvalid = cityInp;
        ok = false;
      }

      const postalVal = postalInp.value.trim();
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
  // 8. ORDER REFERENCE & UI STATE
  // =========================================================================

  function generateOrderReference(prefix = "MCS-CA") {
    const now = new Date();
    const datePart =
      String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}-${datePart}-${rand}`;
  }

  function setLoadingState(loading, label = "Processing order…") {
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoad = submitBtn.querySelector(".btn-loading");
    if (btnText) btnText.style.display = loading ? "none" : "inline";
    if (btnLoad) {
      btnLoad.style.display = loading ? "inline-flex" : "none";
      const labelNode = btnLoad.lastChild;
      if (labelNode && label) {
        labelNode.textContent = ` ${label}`;
      }
    }
    submitBtn.disabled = loading;
  }

  function showSuccessScreen(confirmedLabel, options = {}) {
    const { isRental = false, isCod = false } = options;

    layoutEl.style.display = "none";
    emptyEl.style.display = "none";
    if (rentalBanner) rentalBanner.style.display = "none";
    const pageHeader = document.querySelector(".checkout-page-header");
    if (pageHeader) pageHeader.style.display = "none";
    if (orderNumEl) orderNumEl.textContent = confirmedLabel;

    const successKicker = document.getElementById("checkout-success-kicker") || successEl.querySelector(".page-kicker");
    const successTitle = document.getElementById("checkout-success-title") || successEl.querySelector(".checkout-success-title");
    const successLead = document.getElementById("checkout-success-lead-text");
    const successText = document.getElementById("checkout-success-text") || successEl.querySelector(".checkout-success-text");

    if (isRental) {
      if (successKicker) successKicker.textContent = "RENTAL RESERVATION RECEIVED";
      if (successTitle) successTitle.textContent = "Reservation Confirmed";
      if (successLead) successLead.textContent = "Your archive rental request";
      if (successText) {
        successText.textContent = isCod
          ? "Your rental reservation (Cash on Delivery) has been confirmed. Our studio concierge will contact you shortly to arrange your fitting and cash payment at handover."
          : "A confirmation email and notification have been dispatched. Our studio concierge will contact you shortly to coordinate your private fitting and dispatch schedule.";
      }
    } else if (isCod) {
      if (successKicker) successKicker.textContent = "ORDER CONFIRMED — CASH ON DELIVERY";
      if (successTitle) successTitle.textContent = "Thank You";
      if (successText) {
        successText.textContent = "Your archival order has been confirmed for Cash on Delivery. Our studio concierge will contact you shortly to confirm delivery timing and cash payment details.";
      }
    }

    successEl.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =========================================================================
  // 9. DISPATCH GMAIL EMAIL NOTIFICATION
  // =========================================================================

  async function sendOrderNotificationEmail(orderPayload, stage = "checkout") {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(BACKEND_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        order: Object.assign({}, orderPayload, { stage }),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch (err) {
    console.warn("Could not dispatch email notification:", err);
    return null;
  }
}

  // =========================================================================
  // 10. STRIPE CHECKOUT API
  // =========================================================================

  async function createStripeSession(orderPayload, orderRef) {
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/[^/]*$/, "");
    const baseUrl = `${origin}${pathname}`;

    const stripeItems = [...orderPayload.items];
    if (orderPayload.shipping_fee > 0) {
      stripeItems.push({
        id: "shipping_fee",
        brand: "Monroe Studio",
        title: `Shipping (${orderPayload.delivery_method})`,
        price: orderPayload.shipping_fee,
        quantity: 1
      });
    }

    const res = await fetch(BACKEND_STRIPE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: stripeItems,
        customer_email: orderPayload.email,
        order_ref: orderRef,
        currency: "cad",
        metadata: {
          order_ref: orderRef,
          customer_name: orderPayload.customer_name || "",
          phone: orderPayload.phone || "",
          is_rental: String(Boolean(orderPayload.isRental)),
          delivery_method: orderPayload.delivery_method || ""
        },
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
  // 11. ORDER SUBMISSION
  // =========================================================================

  async function submitOrder() {
    if (isSubmitting) return;
    if (!validate()) return;

    let itemsForOrder = [];
    let subtotalAmount = 0;
    let rentalData = null;

    if (isRentalMode) {
      if (!rentalPiece) {
        showFormAlert("Rental item could not be loaded. Please return to archive lookbook.");
        return;
      }
      const pricing = getRentalPricing(rentalPiece);
      subtotalAmount = pricing.total;

      const startDateVal = rentalStartDateInp?.value || "";
      const endDateVal = rentalEndDateInp?.value || "";
      const purposeVal = rentalPurposeSelect?.value || "Editorial / Photoshoot";

      rentalData = {
        startDate: startDateVal,
        endDate: endDateVal,
        days: pricing.days,
        purpose: purposeVal,
        depositAmount: 250
      };

      itemsForOrder = [
        {
          id: rentalPiece.id,
          brand: rentalPiece.brand || "Monroe Archive",
          title: `[Archive Rental — ${pricing.days} Days] ${rentalPiece.title || "Archival piece"}`,
          price: pricing.total,
          quantity: 1,
          image: sanitizeImageUrl((rentalPiece.images && rentalPiece.images[0]) || "img/Monreo.png")
        }
      ];
    } else {
      const cart = getCart();
      if (cart.length === 0) {
        render();
        return;
      }
      subtotalAmount = cart.reduce(
        (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
        0
      );
      itemsForOrder = cart.map((i) => ({
        id: i.id,
        brand: i.brand || "",
        title: i.title || "",
        price: Number(i.price) || 0,
        quantity: Math.max(1, Number(i.quantity) || 1),
        image: sanitizeImageUrl(i.image)
      }));
    }

    const name           = (document.getElementById("checkout-name")?.value || "").trim().slice(0, 120);
    const phone          = (document.getElementById("checkout-phone")?.value || "").trim().slice(0, 30);
    const email          = (document.getElementById("checkout-email")?.value || "").trim().slice(0, 160);
    const socialHandle   = (document.getElementById("checkout-social")?.value || "").trim().slice(0, 100);
    const deliveryMethod = deliverySelect?.value || (isRentalMode ? "showroom_fitting" : "canada_post_expedited");
    const shippingFee    = getShippingFee(deliveryMethod);
    const grandTotal     = subtotalAmount + shippingFee;
    const address        = (document.getElementById("checkout-address")?.value || "").trim().slice(0, 240);
    const city           = (document.getElementById("checkout-city")?.value || "").trim().slice(0, 100);
    const province       = provinceSelect?.value || "ON";
    const postalCode     = (document.getElementById("checkout-postal")?.value || "").trim().toUpperCase().slice(0, 16);
    const paymentMethod  = paymentSelect ? paymentSelect.value : "stripe";
    const notes          = (document.getElementById("checkout-notes")?.value || "").trim().slice(0, 500);

    const orderRef = generateOrderReference(isRentalMode ? "MCS-RENT" : "MCS-CA");
    const useStripe = isStripePayment(paymentMethod);
    const cod = isCashOnDelivery(paymentMethod);

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
      isRentalMode ? `[RENTAL: ${rentalData.startDate} to ${rentalData.endDate} (${rentalData.days} days) | Purpose: ${rentalData.purpose}]` : null,
      `Delivery: ${deliveryMethod}`,
      cod ? "Payment: Cash on Delivery" : null,
      shippingFee > 0 ? `Shipping: CA$${shippingFee}` : null,
      notes
    ]
      .filter(Boolean)
      .join(" | ");

    const orderPayload = {
      order_ref: orderRef,
      customer_name: name || null,
      phone: phone,
      email: email || null,
      social_handle: socialHandle || null,
      delivery_method: deliveryMethod,
      shipping_fee: shippingFee,
      city: city || null,
      branch_or_address: fullShippingAddress || null,
      payment_method: paymentMethod,
      notes: combinedNotes || null,
      items: itemsForOrder,
      subtotal_amount: subtotalAmount,
      total_amount: grandTotal,
      currency: "CAD",
      status: useStripe ? "pending_payment" : (cod ? "confirmed_cod" : "confirmed"),
      isRental: isRentalMode,
      type: isRentalMode ? "rental" : "purchase",
      rental_details: rentalData
    };

    isSubmitting = true;
    setLoadingState(
      true,
      useStripe
        ? "Connecting to Stripe…"
        : (isRentalMode ? "Confirming reservation…" : "Confirming order…")
    );

    try {
      await sendOrderNotificationEmail(orderPayload);

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

      // Only redirect to Stripe if Stripe was explicitly selected
      if (useStripe && !cod) {
        try {
          const checkoutUrl = await createStripeSession(orderPayload, orderRef);
          savePendingOrder({ ref: orderRef, payload: orderPayload });
          if (!isRentalMode) {
            saveCart([]);
            syncGlobalCart([]);
          }
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

      // Cash on Delivery / non-Stripe direct confirmation (no Stripe redirect)
      if (!isRentalMode) {
        saveCart([]);
        syncGlobalCart([]);
      }
      if (window.history && window.history.replaceState) {
        const cleanUrl = isRentalMode
          ? `${window.location.pathname}?mode=rental${rentalProductId ? `&productId=${encodeURIComponent(rentalProductId)}` : ""}`
          : window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      showSuccessScreen(`#${orderRef}`, { isRental: isRentalMode, isCod: cod });
    } catch (err) {
      console.error("Submission error:", err);
      savePendingOrder({ ref: orderRef, payload: orderPayload });
      showFormAlert(
        `An unexpected error occurred (${orderRef}). Your details were saved — please reach out to @monroecloset.studio or info@monroecloset.studio.`
      );
    } finally {
      isSubmitting = false;
      setLoadingState(false);
    }
  }

  // =========================================================================
  // 12. STRIPE RETURN HANDLER
  // =========================================================================

  async function handleStripeReturn() {
    const stripeStatus = urlParams.get("stripe_status");
    const ref = urlParams.get("ref");

    if (stripeStatus === "success") {
      saveCart([]);
      syncGlobalCart([]);
      const saved = getLatestPendingOrder(ref);
      if (saved && saved.payload) {
        const confirmedPayload = Object.assign({}, saved.payload, {
          status: "paid_stripe",
          stage: "pay",
          notes: `${saved.payload.notes || ""} | Stripe Payment Confirmed`
        });
        await sendOrderNotificationEmail(confirmedPayload, "pay");
      }
      showSuccessScreen(ref ? `#${ref}` : "CONFIRMED", {
        isRental: isRentalMode || Boolean(ref && ref.includes("RENT")),
        isCod: false
      });
      return true;
    }

    if (stripeStatus === "cancelled") {
      render();
      showFormAlert(
        "Stripe payment was cancelled. Your selections have been preserved — you can try again or select Cash on Delivery."
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
      if (isRentalMode) {
        window.location.href = "checkout.html";
        return;
      }
      const cart = getCart();
      if (cart.length > 0) {
        render();
        form.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // =========================================================================
  // 13. INITIALIZATION
  // =========================================================================

  handleStripeReturn().then((handled) => {
    if (!handled) {
      render();
    }
  });
})();