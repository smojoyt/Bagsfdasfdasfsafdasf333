import { getPromotions } from "../Promotions/promotions.js";
import { createCatalogCard } from "../Cards/Catalog/catalogCard.js";
import { loadLikeData, initLikeListeners } from "../Shared/itemLikes.js";

// Simple shuffle function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export async function renderSortedCatalog(entries) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const promoList = await getPromotions();

  // 🔀 Shuffle entries
  const shuffledEntries = Array.from(entries);
  shuffleArray(shuffledEntries);

  for (const [sku, product] of shuffledEntries) {
    if (product.tags?.includes("Discontinued")) continue;

    const card = await createCatalogCard(sku, product, promoList);
    if (card instanceof Node) {
      fragment.appendChild(card);
    } else {
      console.warn(`❌ Skipped appending card for ${sku} — result not a Node`, card);
    }
  }

  grid.appendChild(fragment);

  loadLikeData("https://api.jsonbin.io/v3/b/688826337b4b8670d8a8f0aa/latest")
    .then(() => {
      initLikeListeners("https://hook.us2.make.com/k0uy3qgmij94koufp7enklxc5ejiby2x");
    });
}
