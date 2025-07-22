import { getPromotions } from "../Promotions/promotions.js";
import { createCatalogCard } from "../Cards/Catalog/catalogCard.js"; // updated import


export async function renderSortedCatalog(entries) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const promoList = await getPromotions(); // ✅ Fetch once

  for (const [sku, product] of entries) {
    if (product.tags?.includes("Discontinued")) continue;

    const card = await createCatalogCard(sku, product, promoList); // ✅ Await here!
    if (card instanceof Node) {
      fragment.appendChild(card);
    } else {
      console.warn(`❌ Skipped appending card for ${sku} — result not a Node`, card);
    }
  }

  grid.appendChild(fragment);


}

