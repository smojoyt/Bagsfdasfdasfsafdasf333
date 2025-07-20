export function getActivePromo(product, promotions) {
  const now = new Date();
  const productCategory = (Array.isArray(product.category) ? product.category[0] : product.category)?.toLowerCase();

  return promotions.find(promo => {
    const promoCategory = promo.category?.toLowerCase();
    const start = new Date(promo.startDate || "2000-01-01");
    const end = new Date(promo.endDate || "9999-12-31");
    return (
      promoCategory === productCategory &&
      now >= start && now <= end
    );
  });
}

export function calculatePrice(product, promo) {
  let finalPrice = Number(product.price) || 0;
  let originalPrice = null;

  if (promo && typeof promo.amount === "number") {
    originalPrice = finalPrice;
    if (promo.type === "percent") {
      finalPrice = finalPrice * (1 - promo.amount / 100);
    } else if (promo.type === "fixed") {
      finalPrice = Math.max(0, finalPrice - promo.amount);
    }
  }

  return { finalPrice, originalPrice };
}
