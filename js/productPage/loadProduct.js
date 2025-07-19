export async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const sku = params.get("sku");
  if (!sku) return null;

  try {
    const [productRes, promoRes] = await Promise.all([
      fetch("/products/products.json"),
      fetch("/products/promotion.json"),
    ]);

    const products = await productRes.json();
    const { promotions } = await promoRes.json();
    const product = products[sku];
    if (!product) return null;

    const now = new Date();

    const activePromo = promotions.find(promo => {
      const start = new Date(promo.startDate || "2000-01-01");
      const end = new Date(promo.endDate || "9999-12-31");
      const promoCat = promo.category?.toLowerCase();
      const productCat = (Array.isArray(product.category) ? product.category[0] : product.category)?.toLowerCase();

      return (
        promoCat === productCat &&
        now >= start &&
        now <= end &&
        (!promo.condition?.minPrice || product.price >= promo.condition.minPrice) &&
        (!promo.condition?.maxPrice || product.price <= promo.condition.maxPrice)
      );
    });

    return { product, activePromo };
  } catch (err) {
    console.error("❌ Error loading product or promo data:", err);
    return null;
  }
}
