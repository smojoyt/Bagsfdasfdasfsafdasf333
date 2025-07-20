export function getMatchingPromotion(product, promotions = []) {
  const now = new Date();

  // Only check promos that are featured ✅
  const featuredPromos = promotions.filter(p => p.featured);

  const categories = [
    ...(Array.isArray(product.category) ? product.category : [product.category]),
    ...(product.tags || [])
  ].map((c) => c?.toLowerCase?.()).filter(Boolean);

  for (const promo of featuredPromos) {
    const start = new Date(promo.startDate || "2000-01-01");
    const end = new Date(promo.endDate || "9999-12-31");
    const promoCat = promo.category?.toLowerCase();

    const minOk = !promo.condition?.minPrice || product.price >= promo.condition.minPrice;
    const maxOk = !promo.condition?.maxPrice || product.price <= promo.condition.maxPrice;

    if (
      now >= start &&
      now <= end &&
      categories.includes(promoCat) &&
      minOk &&
      maxOk &&
      typeof promo.amount === "number"
    ) {
      return {
        type: promo.type === "percentage" ? "percent" : "fixed",
        amount: promo.amount
      };
    }
  }

  return null;
}
