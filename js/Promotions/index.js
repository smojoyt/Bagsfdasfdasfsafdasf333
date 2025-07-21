import products from "../../products/products.json" assert { type: "json" };
import { createTestCard } from "../testcard.js";

/**
 * Initializes a card for a given SKU into the provided DOM container.
 * @param {HTMLElement} container - DOM element to insert the card into
 * @param {string} sku - Product SKU
 */
export async function initProductCard(container, sku) {
  if (!container || !sku) {
    console.warn("❌ Missing container or SKU");
    return;
  }

  const product = products[sku];
  if (!product) {
    console.warn("❌ Product not found for SKU:", sku);
    return;
  }

  // 🚫 Skip discontinued products
  if (product.tags?.map(t => t.toLowerCase()).includes("discontinued")) {
    console.warn(`⚠️ Skipping discontinued product: ${sku}`);
    return;
  }

  const card = await createTestCard(sku, product);
  container.appendChild(card);
}
