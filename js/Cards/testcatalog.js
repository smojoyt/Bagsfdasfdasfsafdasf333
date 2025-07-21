import { createTestCard } from "./testcard.js";

/**
 * Renders a catalog of product cards into a container.
 * @param {HTMLElement} container
 * @param {string[]} skus - Array of product SKUs to render
 */
export async function renderTestCatalog(container, skus) {
  if (!container || !Array.isArray(skus)) return;

  let products = {};
  try {
    const res = await fetch("/products/products.json");
    products = await res.json();
  } catch (err) {
    console.error("❌ Failed to load products.json:", err);
    return;
  }

  for (const sku of skus) {
    const product = products[sku];
    if (!product) continue;

    const card = await createTestCard(sku, product);
    container.appendChild(card);
  }
}

// ✅ Automatically run if test-zone exists on the page
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("test-zone");
  if (!container) return;

  const testSKUs = ["Headwear_EarflapBeanie", "Charms_CatPin", "Charms_CherryChain"];
  await renderTestCatalog(container, testSKUs);
});
