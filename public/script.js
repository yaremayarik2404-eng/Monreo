/**
 * MONROE CLOSET STUDIO — CORE JAVASCRIPT
 * Multi-page navigation, Cart Drawer with LocalStorage, Search & Filter Engine, and Product Detail Viewer.
 */

// =============================================================================
// 0. DATA ACCESS HELPERS & CURRENCY FORMATTING
// =============================================================================


document.addEventListener("DOMContentLoaded", async () => {
  await fetchProductsFromSupabase();

  if (typeof populateBrandFilter === "function") {
    populateBrandFilter();
  }
  if (typeof renderShopCatalog === "function") {
    renderShopCatalog();
  }
  if (typeof initProductDetailPage === "function") {
    initProductDetailPage();
  }
  if (typeof renderHomeFeatured === "function") {
    renderHomeFeatured();
  }
  if (typeof renderRentalFeatured === "function") {
    renderRentalFeatured();
  }

    renderCartDrawer();


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

  // Checkout button — navigate to checkout page
  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (studioCart.length === 0) return;
    window.location.href = "checkout.html";
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

function getStudioProducts() {
  if (typeof window.getProductItems === "function") {
    return window.getProductItems();
  }
  if (Array.isArray(window.MONROE_PRODUCTS)) {
    if (window.MONROE_PRODUCTS.length > 0 && Array.isArray(window.MONROE_PRODUCTS[0]?.items)) {
      return window.MONROE_PRODUCTS[0].items;
    }
    return window.MONROE_PRODUCTS;
  }
  return [];
}

function getCurrencySymbol() {
  const cur = (Array.isArray(window.MONROE_PRODUCTS) && window.MONROE_PRODUCTS[0]?.currency) || "UAH";
  if (cur === "UAH") return " ₴";
  if (cur === "USD") return "$";
  if (cur === "EUR") return "€";
  return ` ${cur}`;
}

function formatPrice(amount) {
  const sym = getCurrencySymbol();
  const num = Number(amount) || 0;
  if (sym.startsWith(" ")) {
    return `${num.toLocaleString()}${sym}`;
  }
  return `${sym}${num.toLocaleString()}`;
}

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
  const product = typeof window.getProductById === "function"
    ? window.getProductById(productId)
    : getStudioProducts().find(p => p.id === productId);
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
      image: (product.images && product.images[0]) || "",
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
  if (subtotalEl) subtotalEl.textContent = formatPrice(totalAmount);

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
        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
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
    category: item.category || "Women's Clothing",
    subcategory: item.subcategory || "Blazers & Jackets",
    price: Number(item.price) || 1200,
    originalPrice: Number(item.originalPrice) || Number(item.price) * 1.3,
    condition: item.condition || "Pristine",
    rentalAvailable: Boolean(item.rentalAvailable),
    rentalPrice: Number(item.rentalPrice) || 0,
    images: Array.isArray(item.images) && item.images.length > 0 
      ? item.images 
      : [item.image || "img/monroe-logo.png"],
    description: item.description || "Archival luxury piece.",
    details: item.details || {
      composition: "Pure Natural Fiber",
      origin: "Made in France",
      conditionNotes: "Pristine condition."
    }
  };

  const list = getStudioProducts();
  list.unshift(newProduct);
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

function matchesCategory(item, cat) {
  if (!cat || cat === "All") return true;
  const c = cat.toLowerCase();
  const itemCat = (item.category || "").toLowerCase();
  const itemSub = (item.subcategory || "").toLowerCase();

  if (itemCat === c) return true;
  if (c === "clothing" && (itemCat.includes("clothing") || itemCat.includes("clothes"))) return true;
  if (c === "bags" && (itemCat.includes("bag") || itemSub.includes("bag"))) return true;
  if (c === "shoes" && (itemCat.includes("shoe") || itemSub.includes("shoe") || itemSub.includes("sandals") || itemSub.includes("mules") || itemSub.includes("heels"))) return true;
  if (c.includes("accessor") && (itemCat.includes("accessor") || itemSub.includes("earring") || itemSub.includes("jewelry") || itemSub.includes("sunglass") || itemSub.includes("glasses"))) return true;
  if (c.includes("home") || c.includes("interior") || c.includes("decor")) {
    return itemCat.includes("home") || itemCat.includes("interior") || itemSub.includes("decor");
  }
  return itemCat.includes(c) || itemSub.includes(c);
}

function matchesSubcategory(item, sub) {
  if (!sub || sub === "All") return true;
  const s = sub.toLowerCase();
  const itemSub = (item.subcategory || "").toLowerCase();
  return itemSub.includes(s);
}

function populateBrandFilter() {
  const brandSelect = document.getElementById("shop-filter-brand");
  if (!brandSelect) return;
  const items = getStudioProducts();
  const brands = [...new Set(items.map(i => i.brand).filter(Boolean))].sort();
  const currentVal = activeShopFilters.brand;

  brandSelect.innerHTML = `<option value="All">All Designers</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");

  if (brands.some(b => b.toUpperCase() === currentVal.toUpperCase())) {
    brandSelect.value = currentVal;
  } else {
    brandSelect.value = "All";
  }
}

function renderShopCatalog() {
  const grid = document.getElementById("catalog-products-grid");
  const emptyView = document.getElementById("catalog-empty-view");
  if (!grid) return;

  

  let list = [...getStudioProducts()];

  // 1. Search Query
  if (activeShopFilters.searchQuery.trim() !== "") {
    const q = activeShopFilters.searchQuery.toLowerCase();
    list = list.filter(p => 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // 2. Category
  if (activeShopFilters.category !== "All") {
    list = list.filter(p => matchesCategory(p, activeShopFilters.category));
  }

  // 3. Subcategory
  if (activeShopFilters.subcategory !== "All") {
    list = list.filter(p => matchesSubcategory(p, activeShopFilters.subcategory));
  }

  // 4. Brand
  if (activeShopFilters.brand !== "All") {
    list = list.filter(p => (p.brand || "").toUpperCase() === activeShopFilters.brand.toUpperCase());
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

  // Render product cards
  grid.innerHTML = list.map(item => {
    const mainImg = (item.images && item.images[0]) || "img/monroe-logo.png";
    const hoverImg = (item.images && item.images[1]) || mainImg;
    return `
      <article class="product-card">
        <a href="product.html?id=${item.id}" class="product-media" title="View ${item.title}">
          <img src="${mainImg}" alt="${item.brand} ${item.title}" class="img-main" loading="lazy">
          <img src="${hoverImg}" alt="${item.brand} ${item.title}" class="img-hover" loading="lazy">
        </a>
        <div class="product-meta">
          <span class="meta-brand">${item.brand}</span>
          <a href="product.html?id=${item.id}" class="meta-title">${item.title}</a>
          <span class="meta-price">${formatPrice(item.price)}</span>
          <a href="product.html?id=${item.id}" class="view-details-link">View Details →</a>
        </div>
      </article>
    `;
  }).join("");

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
    if (activeShopFilters.category === "Clothing" || activeShopFilters.category.toLowerCase().includes("cloth")) {
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
  const product = typeof window.getProductById === "function" 
    ? window.getProductById(id) 
    : getStudioProducts().find(p => p.id === id);

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
  const images = (product.images && product.images.length > 0) ? product.images : ["img/monroe-logo.png"];

  // Словник гарних назв для стандартних ключів (для кастомних назва підтягнеться автоматично)
  const specLabelsMap = {
    composition: "Composition",
    size: "Size / Fit",
    measurements: "Measurements",
    heelHeight: "Heel Height",
    weight: "Weight",
    origin: "Origin",
    conditionNotes: "Condition",
    authenticity: "Authenticity"
  };

  // Беремо всі непорожні пари з об'єкта details
  const detailEntries = Object.entries(details).filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== "");
  const hasSpecs = detailEntries.length > 0;

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
          <div class="product-thumbs">
            ${images.map((imgUrl, i) => `
              <button class="thumb-btn ${i === 0 ? 'is-active' : ''}" onclick="switchDetailPhoto('${imgUrl}', this)" aria-label="Angle ${i + 1}">
                <img src="${imgUrl}" alt="Thumbnail ${i + 1}">
              </button>
            `).join("")}
          </div>

          <div class="product-main-stage">
            <img src="${images[0]}" alt="${product.brand} ${product.title}" id="detail-main-img" class="detail-main-photo">
          </div>
        </div>

        <!-- Clean Editorial Info Column (без акордеонів) -->
        <div class="product-info-column editorial-info">
          <div class="editorial-header">
            <span class="product-brand-kicker">${product.brand}</span>
            ${product.condition ? `<span class="editorial-condition">${product.condition}</span>` : ''}
          </div>

          <h1 class="product-headline editorial-title">${product.title}</h1>

          <div class="editorial-price-row">
            <span class="product-primary-price">${formatPrice(product.price)}</span>
            ${product.originalPrice > product.price ? `
              <span class="product-orig-price">Est. Retail ${formatPrice(product.originalPrice)}</span>
            ` : ''}
          </div>

          ${details.size ? `
            <div class="editorial-size-line">
              <span class="size-label">Size</span>
              <span class="size-value">${details.size}</span>
            </div>
          ` : ''}

          <!-- Primary Actions -->
          <div class="editorial-actions">
            <button class="btn-add-bag" onclick="addToCart('${product.id}')">
              Add to Bag — ${formatPrice(product.price)}
            </button>

            ${product.rentalAvailable ? `
              <a href="rental.html" class="btn-rent-minimal">
                Rent for 3 Days — ${formatPrice(product.rentalPrice)}
              </a>
            ` : ''}

            <a href="https://www.instagram.com/monroecloset.studio" target="_blank" rel="noopener" class="editorial-concierge-link">
              Ask a Stylist on Instagram →
            </a>
          </div>

          <!-- Open Information Sections -->
          <div class="editorial-open-sections">
          ${hasSpecs ? `
              <div class="ed-block">
                <h2 class="ed-block-title">Details & Measurements</h2>
                <ul class="ed-specs">
                  ${detailEntries.map(([key, val]) => {
                    // Якщо ключ є в словнику — беремо гарну назву, інакше робимо першу літеру великою
                    const label = specLabelsMap[key] || (key.charAt(0).toUpperCase() + key.slice(1));
                    return `<li><span>${label}</span><span>${val}</span></li>`;
                  }).join("")}
                </ul>
              </div>
            ` : ''}
            ${product.description ? `
                <div class="ed-block">
                  <h2 class="ed-block-title">Description</h2>
                  <p class="ed-desc">${product.description}</p>
                </div>
              `
             : ''}


          </div>
        </div>

      </div>

      <!-- Related Items -->
      <section class="related-section">
        <h2 class="related-title">You May Also Admire</h2>
        <div class="minimal-grid">
          ${getStudioProducts().filter(p => p.id !== product.id).slice(0, 4).map(rel => {
            const rMain = (rel.images && rel.images[0]) || "img/monroe-logo.png";
            const rHov = (rel.images && rel.images[1]) || rMain;
            return `
              <article class="product-card">
                <a href="product.html?id=${rel.id}" class="product-media">
                  <img src="${rMain}" alt="${rel.title}" class="img-main">
                  <img src="${rHov}" alt="${rel.title}" class="img-hover">
                </a>
                <div class="product-meta">
                  <span class="meta-brand">${rel.brand}</span>
                  <a href="product.html?id=${rel.id}" class="meta-title">${rel.title}</a>
                  <span class="meta-price">${formatPrice(rel.price)}</span>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>

    </div>
  `;  enableProductImageZoom();
  enableMobileGalleryLightbox(images)
}
let lightboxImages = [];
let lightboxIndex = 0;

function updateLightboxView() {
  const overlay = document.getElementById("lightbox-overlay");
  const lightboxImg = document.getElementById("lightbox-img");
  const counterEl = document.getElementById("lightbox-counter");
  if (!overlay || !lightboxImg || lightboxImages.length === 0) return;

  const safeIdx = ((lightboxIndex % lightboxImages.length) + lightboxImages.length) % lightboxImages.length;
  lightboxIndex = safeIdx;
  lightboxImg.src = lightboxImages[lightboxIndex];
  lightboxImg.alt = `Gallery image ${lightboxIndex + 1} of ${lightboxImages.length}`;

  if (counterEl) {
    counterEl.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
  }
}

function openGalleryLightbox(images, startIndex = 0) {
  const overlay = document.getElementById("lightbox-overlay");
  if (!overlay || !Array.isArray(images) || images.length === 0) return;

  lightboxImages = images;
  lightboxIndex = startIndex;
  updateLightboxView();

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
  const overlay = document.getElementById("lightbox-overlay");
  if (!overlay) return;

  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function enableMobileGalleryLightbox(images) {
  const stage = document.querySelector(".product-main-stage");
  const mainImg = document.getElementById("detail-main-img");
  const overlay = document.getElementById("lightbox-overlay");
  if (!stage || !mainImg || !overlay) return;

  // Створюємо кнопки навігації і лічильник один раз
  if (!document.getElementById("lightbox-prev")) {
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.id = "lightbox-prev";
    prevBtn.className = "lightbox-nav lightbox-prev";
    prevBtn.setAttribute("aria-label", "Previous image");
    prevBtn.textContent = "‹";

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.id = "lightbox-next";
    nextBtn.className = "lightbox-nav lightbox-next";
    nextBtn.setAttribute("aria-label", "Next image");
    nextBtn.textContent = "›";

    const counter = document.createElement("div");
    counter.id = "lightbox-counter";
    counter.className = "lightbox-counter";

    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(counter);

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      lightboxIndex -= 1;
      updateLightboxView();
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      lightboxIndex += 1;
      updateLightboxView();
    });
  }

  // Натискання на головне фото відкриває галерею (особливо зручно на телефонах/тач-екранах)
  stage.addEventListener("click", () => {
    const currentSrc = mainImg.getAttribute("src");
    const foundIdx = images.indexOf(currentSrc);
    openGalleryLightbox(images, foundIdx >= 0 ? foundIdx : 0);
  });

  // Закриття по кнопці або кліку по темному фону
  document.getElementById("lightbox-close")?.addEventListener("click", closeGalleryLightbox);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeGalleryLightbox();
  });

  // Свайп вліво/вправо всередині галереї на телефоні
  let touchStartX = 0;
  overlay.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  overlay.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      lightboxIndex += diff < 0 ? 1 : -1;
      updateLightboxView();
    }
  }, { passive: true });
}

function enableProductImageZoom() {
  const stage = document.querySelector(".product-main-stage");
  const img = document.getElementById("detail-main-img");
  if (!stage || !img) return;

  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(2.2)"; // Сила збільшення при розгляданні
  });

  stage.addEventListener("mouseleave", () => {
    img.style.transformOrigin = "center center";
    img.style.transform = "scale(1)";
  });
}


function switchDetailPhoto(imgUrl, buttonEl) {
  const mainPhoto = document.getElementById("detail-main-img");
  if (mainPhoto) mainPhoto.src = imgUrl;
  document.querySelectorAll(".thumb-btn").forEach(btn => btn.classList.remove("is-active"));
  buttonEl?.classList.add("is-active");
}
window.switchDetailPhoto = switchDetailPhoto;

// =============================================================================
// 7. HOMEPAGE & RENTAL PAGE FEATURED GRIDS
// =============================================================================


function renderRentalFeatured() {
  const grid = document.getElementById("rental-featured-grid");
  if (!grid) return;
  const items = getStudioProducts().filter(p => p.rentalAvailable).slice(0, 4);
  grid.innerHTML = items.map(item => {
    const mainImg = (item.images && item.images[0]) || "img/monroe-logo.png";
    const hoverImg = (item.images && item.images[1]) || mainImg;
    return `
      <article class="product-card">
        <a href="product.html?id=${item.id}" class="product-media" title="View ${item.title}">
          <img src="${mainImg}" alt="${item.brand} ${item.title}" class="img-main" loading="lazy">
          <img src="${hoverImg}" alt="${item.brand} ${item.title}" class="img-hover" loading="lazy">
        </a>
        <div class="product-meta">
          <span class="meta-brand">${item.brand}</span>
          <a href="product.html?id=${item.id}" class="meta-title">${item.title}</a>
          <span class="meta-price">Rent from ${formatPrice(item.rentalPrice)} / 3 Days</span>
          <a href="product.html?id=${item.id}" class="view-details-link">View Details & Book →</a>
        </div>
      </article>
    `;
  }).join("");
}

// =============================================================================
// 8. EVENT LISTENERS & LIFECYCLE
// =============================================================================




// Good display of items on all pages


(function () {
  const grid = document.getElementById("rental-featured-grid");
  if (!grid) return;

  function formatPriceUah(price) {
    if (price === null || price === undefined || price === "") return "";
    const num = Number(price);
    if (Number.isNaN(num)) return String(price);
    return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₴`;
  }

  function renderRentalProducts(items) {
    if (!Array.isArray(items) || items.length === 0) return;

    const rentalPool = items.filter((p) => p.rentalAvailable === true);
    const source = rentalPool.length > 0 ? rentalPool : items;

    // Динамічно беремо id орендних товарів із актуального списку items
    const rentalIds = rentalPool.map((p) => String(p.id));
    console.log("Rental IDs:", rentalIds);

    const picked = rentalIds
      .map((id) => source.find((p) => String(p.id) === id))
      .filter(Boolean);

    const productsToShow = (picked.length > 0 ? picked : source).slice(0, rentalIds.length);

    grid.innerHTML = productsToShow
      .map((product) => {
        const imgs = Array.isArray(product.images) ? product.images : [];
        const mainImg = imgs[0] || "";
        const hoverImg = imgs[1] || mainImg;
        const title = product.title || "";
        const brand = product.brand || "";
        const imgAlt = `${brand} ${title}`.trim();
        const rentPriceFormatted = formatPriceUah(product.rentalPrice);
        const rentLabel = rentPriceFormatted ? `Rent from ${rentPriceFormatted} / 3 Days` : "";
        const productUrl = `product.html?id=${encodeURIComponent(product.id)}`;

        return `
          <article class="product-card">
            <a href="${productUrl}" class="product-media" title="View ${title}">
              ${mainImg ? `<img src="${mainImg}" alt="${imgAlt}" class="img-main" loading="lazy">` : ""}
              ${hoverImg ? `<img src="${hoverImg}" alt="${imgAlt}" class="img-hover" loading="lazy">` : ""}
            </a>
            <div class="product-meta">
              ${brand ? `<span class="meta-brand">${brand}</span>` : ""}
              <a href="${productUrl}" class="meta-title">${title}</a>
              ${rentLabel ? `<span class="meta-price">${rentLabel}</span>` : ""}
              <a href="${productUrl}" class="view-details-link">View Details & Book →</a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  const initialItems = typeof getProductItems === "function" ? getProductItems() : [];
  if (initialItems.length > 0) {
    renderRentalProducts(initialItems);
  }

  if (typeof fetchProductsFromSupabase === "function") {
    fetchProductsFromSupabase().then((liveItems) => {
      if (Array.isArray(liveItems) && liveItems.length > 0) {
        renderRentalProducts(liveItems);
      }
    });
  }
})();



// WHich items will be in main page

function getMainPageItems(allItems) {
  if (!Array.isArray(allItems) || allItems.length === 0) return [];

  // Фільтруємо ті товари, у яких позначка isonmainpage увімкнена
  const mainPool = allItems.filter((p) => p.isonmainpage === true);

  // Як ти робив із rentalIds: динамічно збираємо масив ID обраних товарів
  const mainIds = mainPool.map((p) => String(p.id));

  // Підтягуємо актуальні об'єкти товарів за цим масивом ID
  const picked = mainIds
    .map((id) => mainPool.find((p) => String(p.id) === id))
    .filter(Boolean);

  return picked;
}

function renderHomeFeatured() {
  const grid = document.getElementById("home-featured-grid");
  if (!grid) return;

  const items = getMainPageItems(getStudioProducts());
  if (items.length === 0) return;

  grid.innerHTML = items
    .map((item) => {
      const imgs = Array.isArray(item.images) ? item.images : [];
      const mainImg = imgs[0] || "";
      const hoverImg = imgs[1] || mainImg;
      const altText = `${item.brand || ""} ${item.title || ""}`.trim();
      const url = `product.html?id=${encodeURIComponent(item.id)}`;

      return `
        <article class="product-card">
          <a href="${url}" class="product-media" title="View ${item.title || ""}">
            ${mainImg ? `<img src="${mainImg}" alt="${altText}" class="img-main" loading="lazy">` : ""}
            ${hoverImg ? `<img src="${hoverImg}" alt="${altText}" class="img-hover" loading="lazy">` : ""}
          </a>
          <div class="product-meta">
            ${item.brand ? `<span class="meta-brand">${item.brand}</span>` : ""}
            <a href="${url}" class="meta-title">${item.title || ""}</a>
            <span class="meta-price">${formatPrice(item.price)}</span>
            <a href="${url}" class="view-details-link">View Details →</a>
          </div>
        </article>
      `;
    })
    .join("");
}