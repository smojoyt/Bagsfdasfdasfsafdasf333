import { currentState } from "./state.js";
import { createProductCard } from "../utils/createProductCard.js";
import { attachCatalogCardHandlers } from "../utils/attachCatalogCardHandlers.js"; // ✅ ADD THIS

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

  attachCatalogCardHandlers(grid); // ✅ ONE listener for swatches + cart
}
