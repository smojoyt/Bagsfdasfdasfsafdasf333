// js/Home/homeData.js

// Single shared loader for Home page data.
// Caches products + promotions so all sections reuse the same fetch.

let productsCache = null;
let promotionsCache = null;
let loadingPromise = null;

async function fetchHomeDataFromServer() {
  const [productRes, promoRes] = await Promise.all([
    fetch("/products/products.json"),
    fetch("/products/promotion.json"),
  ]);

  const products = await productRes.json();
  const promoJson = await promoRes.json();
  const promotions = promoJson.promotions || [];

  return { products, promotions };
}

async function ensureLoaded() {
  // Already have both
  if (productsCache && promotionsCache) {
    return { products: productsCache, promotions: promotionsCache };
  }

  // Reuse in-flight request
  if (!loadingPromise) {
    loadingPromise = fetchHomeDataFromServer()
      .then((data) => {
        productsCache = data.products;
        promotionsCache = data.promotions;
        return data;
      })
      .catch((err) => {
        // Reset so a later call can retry
        loadingPromise = null;
        throw err;
      });
  }

  return loadingPromise;
}

export async function getHomeData() {
  return ensureLoaded();
}

export async function getAllProducts() {
  const { products } = await ensureLoaded();
  return products;
}

export async function getPromotions() {
  const { promotions } = await ensureLoaded();
  return promotions;
}
