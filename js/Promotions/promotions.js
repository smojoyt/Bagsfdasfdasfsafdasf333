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

  const productCategory = Array.isArray(product.category)
    ? product.category[0].toLowerCase()
    : (product.category || "").toLowerCase();

  return promoList.find(promo => {
    const start = new Date(promo.startDate || "2000-01-01");
    const end = new Date(promo.endDate || "9999-12-31");

    const promoCat = (promo.category || "").toLowerCase();
    const min = promo.condition?.minPrice ?? -Infinity;
    const max = promo.condition?.maxPrice ?? Infinity;

    return (
      promo.active !== false &&
      productCategory === promoCat &&
      product.price >= min &&
      product.price <= max &&
      now >= start && now <= end
    );
  }) || null;
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
