export async function fetchProductData() {
  const [productRes, promoRes] = await Promise.all([
    fetch("/products/products.json"),
    fetch("/products/promotion.json")
  ]);
  const products = await productRes.json();
  const { promotions } = await promoRes.json();
  return { products, promotions };
}
