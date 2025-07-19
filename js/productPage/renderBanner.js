export async function renderBanner() {
  const banner = document.getElementById("product-banner");
  const titleEl = document.getElementById("product-title");
  const skuEl = document.getElementById("product-sku"); // New element for product ID

  if (!banner || !titleEl || !skuEl) return;

  // Get SKU from URL
  const params = new URLSearchParams(window.location.search);
  const sku = params.get("sku");
  if (!sku) return;

  try {
    const res = await fetch("/products/products.json");
    const products = await res.json();

    const product = products[sku];
    if (!product) return;

    // Set title and product ID
    titleEl.textContent = product.name || "Product";
    skuEl.textContent = product.product_id || "";

    // Set background banner
    if (product.banner) {
      banner.style.backgroundImage = `url('${product.banner}')`;
    }
  } catch (err) {
    console.error("❌ Failed to load product banner:", err);
  }
}
