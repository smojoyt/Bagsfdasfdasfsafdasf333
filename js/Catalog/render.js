import { getPromotions } from "../Promotions/promotions.js";
import { createCatalogCard } from "../Cards/Catalog/catalogCard.js";
import { loadLikeData, initLikeListeners } from "../Shared/itemLikes.js"; // ✅ Add this

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

  // ✅ Add this to initialize likes after rendering cards
loadLikeData("https://api.jsonbin.io/v3/b/688826337b4b8670d8a8f0aa/latest")
  .then(() => {
    initLikeListeners("https://hook.us2.make.com/k0uy3qgmij94koufp7enklxc5ejiby2x");
  });
}
