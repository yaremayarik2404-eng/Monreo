/**
 * MONROE CLOSET STUDIO — CORE JAVASCRIPT
 * Multi-page navigation, Cart Drawer with LocalStorage, Search & Filter Engine, and Product Detail Viewer.
 */

// =============================================================================
// 1. PERSISTENT CART STATE (Synchronized via LocalStorage)
// =============================================================================

function getStoredCart() {
  try {
    const data = localStorage.getItem("monroe_studio_cart");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

function saveStoredCart(cartData) {
  try {
    localStorage.setItem("monroe_studio_cart", JSON.stringify(cartData));
  } catch (err) {}
}

let studioCart = getStoredCart();

function openCartDrawer() {
  const backdrop = document.getElementById("cart-drawer-backdrop");
  if (backdrop) {
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeCartDrawer() {
  const backdrop = document.getElementById("cart-drawer-backdrop");
  if (backdrop) {
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function addToCart(productId, qty = 1) {
  const product = typeof window.getProductById === "function" ? window.getProductById(productId) : MONROE_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = studioCart.find(i => i.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    studioCart.push({
      id: product.id,
      brand: product.brand,
      title: product.title,
      price: product.price,
      image: product.images[0],
      quantity: qty
    });
  }

  saveStoredCart(studioCart);
  renderCartDrawer();
  openCartDrawer();
  showToast(`Added to Bag: ${product.title}`);
}

function updateCartQty(productId, delta) {
  const idx = studioCart.findIndex(i => i.id === productId);
  if (idx > -1) {
    studioCart[idx].quantity += delta;
    if (studioCart[idx].quantity <= 0) {
      studioCart.splice(idx, 1);
    }
  }
  saveStoredCart(studioCart);
  renderCartDrawer();
}

function removeCartItem(productId) {
  studioCart = studioCart.filter(i => i.id !== productId);
  saveStoredCart(studioCart);
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-container");
  const countBadge = document.getElementById("cart-count");
  const drawerCount = document.getElementById("cart-drawer-count");
  const subtotalEl = document.getElementById("cart-subtotal");

  const totalItems = studioCart.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = studioCart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (countBadge) countBadge.textContent = totalItems;
  if (drawerCount) drawerCount.textContent = totalItems;
  if (subtotalEl) subtotalEl.textContent = "$" + totalAmount.toLocaleString();

  if (!container) return;

  if (studioCart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <p>Your shopping bag is empty.</p>
        <a href="shop.html" class="cart-empty-link" onclick="closeCartDrawer()">Explore The Collection →</a>
      </div>
    `;
    return;
  }

  container.innerHTML = studioCart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}" class="cart-thumb">
      <div class="cart-info">
        <div>
          <span class="cart-item-brand">${item.brand}</span>
          <h4 class="cart-item-name">${item.title}</h4>
        </div>
        <div class="cart-item-price">$${(item.price * item.quantity).toLocaleString()}</div>
        <div class="cart-stepper">
          <button onclick="updateCartQty('${item.id}', -1)" aria-label="Decrease">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartQty('${item.id}', 1)" aria-label="Increase">+</button>
          <button class="cart-del-btn" onclick="removeCartItem('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}

// Global JS API for adding products
window.addCustomProduct = function(item) {
  const newProduct = {
    id: item.id || "m-custom-" + Date.now(),
    brand: (item.brand || "DESIGNER").toUpperCase(),
    title: item.title || "Curated Piece",
    category: item.category || "Clothing",
    subcategory: item.subcategory || "Outerwear",
    price: Number(item.price) || 1200,
    originalPrice: Number(item.originalPrice) || Number(item.price) * 1.3,
    condition: item.condition || "Pristine",
    rentalAvailable: Boolean(item.rentalAvailable),
    rentalPrice: Number(item.rentalPrice) || 0,
    images: Array.isArray(item.images) && item.images.length > 0 
      ? item.images 
      : [item.image || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85"],
    description: item.description || "Archival luxury piece.",
    details: item.details || {
      composition: "Pure Natural Fiber",
      origin: "Made in France",
      conditionNotes: "Pristine condition."
    }
  };

  MONROE_PRODUCTS.unshift(newProduct);
  if (typeof renderShopCatalog === "function") renderShopCatalog();
  showToast(`Added: ${newProduct.title}`);
  return newProduct;
};

// =============================================================================
// 2. SEARCH OVERLAY (Universal across all pages)
// =============================================================================

function openSearchOverlay() {
  const modal = document.getElementById("search-modal");
  modal?.classList.add("active");
  const input = document.getElementById("live-search-input");
  setTimeout(() => input?.focus(), 80);
}

function closeSearchOverlay() {
  document.getElementById("search-modal")?.classList.remove("active");
}

function handleSearchSubmit(query) {
  if (!query) return;
  const isShop = window.location.pathname.endsWith("shop.html") || window.location.pathname.endsWith("/shop");
  if (isShop) {
    if (typeof activeShopFilters !== "undefined") {
      activeShopFilters.searchQuery = query;
      renderShopCatalog();
    }
    closeSearchOverlay();
  } else {
    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
  }
}

// =============================================================================
// 3. MOBILE MENU
// =============================================================================

function openMobileDrawer() {
  document.getElementById("mobile-nav-backdrop")?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMobileDrawer() {
  document.getElementById("mobile-nav-backdrop")?.classList.remove("active");
  document.body.style.overflow = "";
}

// =============================================================================
// 4. TOAST NOTIFICATION
// =============================================================================

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

// =============================================================================
// 5. SHOP CATALOG (shop.html)
// =============================================================================

let activeShopFilters = {
  searchQuery: "",
  category: "All",
  subcategory: "All",
  brand: "All",
  sortBy: "featured"
};

function renderShopCatalog() {
  const grid = document.getElementById("catalog-products-grid");
  const emptyView = document.getElementById("catalog-empty-view");
  if (!grid) return;

  let list = [...MONROE_PRODUCTS];

  // 1. Search Query
  if (activeShopFilters.searchQuery.trim() !== "") {
    const q = activeShopFilters.searchQuery.toLowerCase();
    list = list.filter(p => 
      p.brand.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  // 2. Category
  if (activeShopFilters.category !== "All") {
    list = list.filter(p => p.category.toLowerCase() === activeShopFilters.category.toLowerCase());
  }

  // 3. Subcategory
  if (activeShopFilters.subcategory !== "All") {
    list = list.filter(p => p.subcategory.toLowerCase() === activeShopFilters.subcategory.toLowerCase());
  }

  // 4. Brand
  if (activeShopFilters.brand !== "All") {
    list = list.filter(p => p.brand.toUpperCase() === activeShopFilters.brand.toUpperCase());
  }

  // 5. Sorting
  if (activeShopFilters.sortBy === "price-low") {
    list.sort((a, b) => a.price - b.price);
  } else if (activeShopFilters.sortBy === "price-high") {
    list.sort((a, b) => b.price - a.price);
  }

  // Empty state
  if (list.length === 0) {
    grid.innerHTML = "";
    if (emptyView) emptyView.style.display = "block";
    updateShopControlsUI(0);
    return;
  }

  if (emptyView) emptyView.style.display = "none";

  // Render product cards (Clicking an image or title goes to product.html?id=... with detailed descriptions!)
  grid.innerHTML = list.map(item => `
    <article class="product-card">
      <a href="product.html?id=${item.id}" class="product-media" title="View ${item.title}">
        <img src="${item.images[0]}" alt="${item.brand} ${item.title}" class="img-main" loading="lazy">
        <img src="${item.images[1] || item.images[0]}" alt="${item.brand} ${item.title}" class="img-hover" loading="lazy">
      </a>
      <div class="product-meta">
        <span class="meta-brand">${item.brand}</span>
        <a href="product.html?id=${item.id}" class="meta-title">${item.title}</a>
        <span class="meta-price">$${Number(item.price).toLocaleString()}</span>
        <a href="product.html?id=${item.id}" class="view-details-link">View Details →</a>
      </div>
    </article>
  `).join("");

  updateShopControlsUI(list.length);
}

function updateShopControlsUI(count) {
  // Category tab active styles
  document.querySelectorAll(".shop-cat-btn").forEach(btn => {
    const cat = btn.getAttribute("data-cat");
    btn.classList.toggle("active", cat.toLowerCase() === activeShopFilters.category.toLowerCase());
  });

  // Clothing subcategory pills bar
  const subWrap = document.getElementById("shop-subcategories-bar");
  if (subWrap) {
    if (activeShopFilters.category === "Clothing") {
      subWrap.style.display = "flex";
      document.querySelectorAll(".shop-sub-btn").forEach(btn => {
        const sub = btn.getAttribute("data-sub");
        btn.classList.toggle("active", sub.toLowerCase() === activeShopFilters.subcategory.toLowerCase());
      });
    } else {
      subWrap.style.display = "none";
    }
  }

  // Heading & subtitle tally
  const heading = document.getElementById("shop-heading");
  const countSpan = document.getElementById("shop-items-count");
  if (heading) {
    if (activeShopFilters.subcategory !== "All") {
      heading.textContent = `${activeShopFilters.category} • ${activeShopFilters.subcategory}`;
    } else if (activeShopFilters.category !== "All") {
      heading.textContent = activeShopFilters.category;
    } else {
      heading.textContent = "The Archive Collection";
    }
  }
  if (countSpan) {
    countSpan.textContent = `${count} piece${count === 1 ? '' : 's'}`;
  }
}

function filterShopBy(cat, sub = "All") {
  activeShopFilters.category = cat;
  activeShopFilters.subcategory = sub;
  renderShopCatalog();
}
window.filterShopBy = filterShopBy;

// =============================================================================
// 6. PRODUCT DETAIL PAGE (product.html)
// =============================================================================

function initProductDetailPage() {
  const container = document.getElementById("product-detail-view");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const product = getProductById(id);

  if (!product) {
    container.innerHTML = `
      <div class="container" style="padding: 80px 32px; text-align: center;">
        <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 12px;">Archival piece not found</h2>
        <a href="shop.html" style="font-size: 0.85rem; text-decoration: underline;">Return to Collection →</a>
      </div>
    `;
    return;
  }

  document.title = `${product.brand} — ${product.title} | MONROE CLOSET STUDIO`;

  const details = product.details || {};
  const images = product.images || [];

  container.innerHTML = `
    <div class="container">
      
      <!-- Minimalist Breadcrumb -->
      <nav class="product-breadcrumb">
        <a href="index.html">Home</a>
        <span>/</span>
        <a href="shop.html">Shop</a>
        <span>/</span>
        <a href="shop.html?category=${encodeURIComponent(product.category)}">${product.category}</a>
        <span>/</span>
        <span class="active-crumb">${product.brand}</span>
      </nav>

      <div class="product-layout-split">
        
        <!-- Gallery with Thumbnails -->
        <div class="product-gallery">
          <div class="main-image-wrap">
            <img src="${images[0]}" alt="${product.brand} ${product.title}" id="detail-main-img" class="detail-main-photo">
          </div>

          ${images.length > 1 ? `
            <div class="gallery-thumbs">
              ${images.map((imgUrl, i) => `
                <button class="thumb-btn ${i === 0 ? 'active' : ''}" onclick="switchDetailPhoto('${imgUrl}', this)" aria-label="Angle ${i+1}">
                  <img src="${imgUrl}" alt="Thumbnail ${i+1}">
                </button>
              `).join("")}
            </div>
          ` : ''}
        </div>

        <!-- Specifications & Description Column -->
        <div class="product-info-column">
          <span class="product-brand-kicker">${product.brand}</span>
          <h1 class="product-headline">${product.title}</h1>
          
          <div class="product-price-row">
            <span class="product-primary-price">$${Number(product.price).toLocaleString()}</span>
            ${product.originalPrice > product.price ? `
              <span class="product-orig-price">Retail: $${Number(product.originalPrice).toLocaleString()}</span>
            ` : ''}
            <span class="product-condition-tag">${product.condition}</span>
          </div>

          <!-- Description Text -->
          <div class="product-description-text">
            <p>${product.description}</p>
          </div>

          <!-- Specifications Box -->
          <div class="product-specs-box">
            <h3>Specifications & Provenance</h3>
            <ul class="specs-list">
              ${details.composition ? `<li><strong>Composition:</strong> <span>${details.composition}</span></li>` : ''}
              ${details.size ? `<li><strong>Size / Fit:</strong> <span>${details.size}</span></li>` : ''}
              ${details.measurements ? `<li><strong>Measurements:</strong> <span>${details.measurements}</span></li>` : ''}
              ${details.heelHeight ? `<li><strong>Heel Height:</strong> <span>${details.heelHeight}</span></li>` : ''}
              ${details.weight ? `<li><strong>Weight:</strong> <span>${details.weight}</span></li>` : ''}
              ${details.origin ? `<li><strong>Craftsmanship:</strong> <span>${details.origin}</span></li>` : ''}
              ${details.conditionNotes ? `<li><strong>Condition Report:</strong> <span>${details.conditionNotes}</span></li>` : ''}
              ${details.authenticity ? `<li><strong>Authentication:</strong> <span>${details.authenticity}</span></li>` : ''}
            </ul>
          </div>

          ${product.rentalAvailable ? `
            <div class="rental-option-notice">
              <strong>✨ Rental Available</strong>
              <span>Available for 3-Day Rental at $${product.rentalPrice} CAD with eco dry-cleaning included.</span>
              <a href="rental.html" class="rental-notice-link">View Rental Details →</a>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="product-action-stack">
            <button class="btn-add-bag" onclick="addToCart('${product.id}')">
              Add to Shopping Bag — $${Number(product.price).toLocaleString()}
            </button>
            <a href="https://www.instagram.com/monroecloset.studio" target="_blank" rel="noopener" class="btn-inquire">
              Inquire on Instagram (@monroecloset.studio)
            </a>
          </div>

          <div class="guarantee-points">
            <span>✓ 100% Certified Authentic</span>
            <span>✓ Insured Global Shipping</span>
            <span>✓ Private Studio Fitting Available</span>
          </div>

        </div>

      </div>

      <!-- Related Items -->
      <section class="related-section">
        <h2 class="related-title">You May Also Admire</h2>
        <div class="minimal-grid">
          ${MONROE_PRODUCTS.filter(p => p.id !== product.id).slice(0, 4).map(rel => `
            <article class="product-card">
              <a href="product.html?id=${rel.id}" class="product-media">
                <img src="${rel.images[0]}" alt="${rel.title}" class="img-main">
                <img src="${rel.images[1] || rel.images[0]}" alt="${rel.title}" class="img-hover">
              </a>
              <div class="product-meta">
                <span class="meta-brand">${rel.brand}</span>
                <a href="product.html?id=${rel.id}" class="meta-title">${rel.title}</a>
                <span class="meta-price">$${Number(rel.price).toLocaleString()}</span>
              </div>
            </article>
          `).join("")}
        </div>
      </section>

    </div>
  `;
}

function switchDetailPhoto(imgUrl, buttonEl) {
  const mainPhoto = document.getElementById("detail-main-img");
  if (mainPhoto) mainPhoto.src = imgUrl;
  document.querySelectorAll(".thumb-btn").forEach(btn => btn.classList.remove("active"));
  buttonEl?.classList.add("active");
}
window.switchDetailPhoto = switchDetailPhoto;

// =============================================================================
// 7. EVENT LISTENERS & LIFECYCLE
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  renderCartDrawer();

  // If on product detail page
  if (document.getElementById("product-detail-view")) {
    initProductDetailPage();
  }

  // If on shop catalog page
  if (document.getElementById("catalog-products-grid")) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("category")) activeShopFilters.category = params.get("category");
    if (params.get("sub")) activeShopFilters.subcategory = params.get("sub");
    if (params.get("brand")) activeShopFilters.brand = params.get("brand");
    if (params.get("search")) activeShopFilters.searchQuery = params.get("search");

    renderShopCatalog();

    // Category button clicks
    document.querySelectorAll(".shop-cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeShopFilters.category = btn.getAttribute("data-cat");
        activeShopFilters.subcategory = "All";
        renderShopCatalog();
      });
    });

    // Subcategory pill clicks
    document.querySelectorAll(".shop-sub-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeShopFilters.subcategory = btn.getAttribute("data-sub");
        renderShopCatalog();
      });
    });

    // Brand filter select
    const brandSelect = document.getElementById("shop-filter-brand");
    if (brandSelect) {
      if (activeShopFilters.brand !== "All") brandSelect.value = activeShopFilters.brand;
      brandSelect.addEventListener("change", (e) => {
        activeShopFilters.brand = e.target.value;
        renderShopCatalog();
      });
    }

    // Sort select
    document.getElementById("shop-filter-sort")?.addEventListener("change", (e) => {
      activeShopFilters.sortBy = e.target.value;
      renderShopCatalog();
    });

    // Reset button
    document.getElementById("shop-reset-btn")?.addEventListener("click", () => {
      activeShopFilters = { searchQuery: "", category: "All", subcategory: "All", brand: "All", sortBy: "featured" };
      if (brandSelect) brandSelect.value = "All";
      renderShopCatalog();
    });
  }

  // Cart Open/Close
  document.getElementById("cart-btn")?.addEventListener("click", openCartDrawer);
  document.getElementById("close-cart-btn")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cart-drawer-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "cart-drawer-backdrop") closeCartDrawer();
  });

  // Search Open/Close
  document.getElementById("search-btn")?.addEventListener("click", openSearchOverlay);
  document.getElementById("close-search-btn")?.addEventListener("click", closeSearchOverlay);

  // Search live input & enter submission
  const searchInput = document.getElementById("live-search-input");
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(searchInput.value.trim());
    }
  });

  // Mobile Drawer
  document.getElementById("burger-menu")?.addEventListener("click", openMobileDrawer);
  document.getElementById("close-mobile-nav-btn")?.addEventListener("click", closeMobileDrawer);
  document.getElementById("mobile-nav-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "mobile-nav-backdrop") closeMobileDrawer();
  });

  // Mobile Accordion: Shop
  const mShopBtn = document.getElementById("mobile-shop-btn");
  mShopBtn?.addEventListener("click", function() {
    this.classList.toggle("open");
    document.getElementById("mobile-shop-content")?.classList.toggle("open");
    const arr = this.querySelector(".acc-arrow");
    if (arr) arr.textContent = this.classList.contains("open") ? "−" : "+";
  });

  // Mobile Accordion: Clothing
  const mClothBtn = document.getElementById("mobile-clothing-btn");
  mClothBtn?.addEventListener("click", function() {
    this.classList.toggle("open");
    document.getElementById("mobile-clothing-content")?.classList.toggle("open");
    const arr = this.querySelector(".acc-arrow");
    if (arr) arr.textContent = this.classList.contains("open") ? "−" : "+";
  });

  // Checkout button simulation
  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (studioCart.length === 0) return;
    alert("Proceeding to secure checkout with Monroe Closet Studio.");
  });

  // Escape Key to close drawers
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCartDrawer();
      closeSearchOverlay();
      closeMobileDrawer();
    }
  });
});
