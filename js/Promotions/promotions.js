let cachedPromotions = null;

export async function getPromotions() {
  if (cachedPromotions) return cachedPromotions;

  try {
    const res = await fetch("/products/promotion.json");
    const data = await res.json();
    cachedPromotions = data.promotions || [];
    return cachedPromotions;
  } catch (err) {
    console.error("❌ Failed to fetch promotions:", err);
    return [];
  }
}

export function matchPromotion(product, promoList) {
  if (!Array.isArray(promoList)) return null;
  const now = new Date();

  // Normalize categories to an array of lowercase strings
  const rawCategories = product.category
    ? (Array.isArray(product.category) ? product.category : [product.category])
    : [];
  const categories = rawCategories.map(c => c.toLowerCase());

  // Normalize tags to lowercase
  const tags = (product.tags || []).map(t => t.toLowerCase());

  const price = product.price ?? 0;

  const promo = promoList.find(promo => {
    const start = new Date(promo.startDate || "2000-01-01");
    const end = new Date(promo.endDate || "9999-12-31");

    if (promo.active === false) return false;
    if (now < start || now > end) return false;

    const promoCat = (promo.category || "").toLowerCase();
    const min = promo.condition?.minPrice ?? -Infinity;
    const max = promo.condition?.maxPrice ?? Infinity;

    // 🧩 Category / tag match:
    // - if promo.category is blank, treat it as "match all"
    // - otherwise match against categories OR tags
    const matchesCategory =
      !promoCat ||
      categories.includes(promoCat) ||
      tags.includes(promoCat);

    const matchesPrice = price >= min && price <= max;

    return matchesCategory && matchesPrice;
  });

  return promo || null;
}


export function calculateDiscountedPrice(product, promo) {
  if (!promo) return product.price;

  if (promo.type === "percent") {
    return product.price * (1 - promo.amount / 100);
  }

  if (promo.type === "fixed") {
    return product.price - promo.amount;
  }

  return product.price;
}
