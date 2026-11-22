const SUPABASE_URL = "https://ngftaomykqwfwyzrtlwj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9oJ3_8ZEiX76-l_LQvvtxQ_A7lp-PxF";

const supabaseClient =
  window.supabase && SUPABASE_URL.startsWith("https://")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function mapDbProduct(row) {
  return {
    id: row.id,
    brand: row.brand,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    originalPrice: row.original_price ?? row.originalPrice ?? 0,
    condition: row.condition,
    rentalAvailable: Boolean(row.rental_available ?? row.rentalAvailable),
    rentalPrice: row.rental_price ?? row.rentalPrice ?? null,
    images: Array.isArray(row.images)
      ? row.images
      : (typeof row.images === "string" && row.images.trim().startsWith("[")
          ? JSON.parse(row.images)
          : (row.images ? [row.images] : [])),
    description: row.description || "",
    details: row.details || {},
    isonmainpage: Boolean(row.isonmainpage ?? row.rentalAvailable)
  };
}

window.getProductById = function(id) {
  if (id === null || id === undefined) return null;
  const targetId = String(id);
  return getProductItems().find(p => String(p.id) === targetId) || null;
};

function getProductItems() {
  if (Array.isArray(window.__LIVE_PRODUCTS__) && window.__LIVE_PRODUCTS__.length > 0) {
    return window.__LIVE_PRODUCTS__;
  }

  if (typeof MONROE_PRODUCTS !== "undefined" && MONROE_PRODUCTS) {
    if (Array.isArray(MONROE_PRODUCTS)) {
      if (MONROE_PRODUCTS.length > 0 && Array.isArray(MONROE_PRODUCTS[0]?.items)) {
        return MONROE_PRODUCTS[0].items;
      }
      return MONROE_PRODUCTS;
    }
    if (Array.isArray(MONROE_PRODUCTS.items)) {
      return MONROE_PRODUCTS.items;
    }
  }

  return [];
}

async function fetchProductsFromSupabase() {
  if (!supabaseClient) return getProductItems();

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    return getProductItems();
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.warn("Supabase returned empty products table");
    return getProductItems();
  }

  window.__LIVE_PRODUCTS__ = data.map(mapDbProduct);
  return window.__LIVE_PRODUCTS__;
}