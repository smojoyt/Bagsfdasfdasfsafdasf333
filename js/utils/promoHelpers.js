export function applyPromotionsToProducts(products, promotions = []) {
  const updated = { ...products };

  promotions.forEach((promo) => {
    const { type, amount, skus = [] } = promo;

    skus.forEach((sku) => {
      const product = updated[sku];
      if (!product) return;

      const basePrice = product.price;
      let newPrice = basePrice;

      if (type === "fixed") {
        newPrice = Math.max(0, basePrice - amount);
      } else if (type === "percentage") {
        newPrice = Math.max(0, basePrice - basePrice * (amount / 100));
      }

      product.sale_price = parseFloat(newPrice.toFixed(2));
    });
  });

  return updated;
}
