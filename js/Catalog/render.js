import { currentState } from "./state.js";
import { createProductCard } from "../utils/createProductCard.js";
import { initUniversalCartHandler } from "../Cart/addToCart.js";

export function renderSortedCatalog(entries) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const [sku, product] of entries) {
    if (product.tags?.includes("Discontinued")) continue;

    const card = createProductCard(sku, product, currentState.currentSearchQuery);
    fragment.appendChild(card);
  }

  grid.appendChild(fragment);

  // ✅ One universal listener for swatches + cart
  initUniversalCartHandler({ root: grid });
}
