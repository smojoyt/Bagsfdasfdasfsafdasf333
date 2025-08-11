import { getPromotions } from "../Promotions/promotions.js";
import { createCatalogCard } from "../Cards/Catalog/catalogCard.js";
import { loadLikeData, initLikeListeners } from "../Shared/itemLikes.js";
import { loadReviewStats } from "../Shared/reviews.js";
import { clearSkeleton } from "../Shared/skeleton.js"; // ⬅️ ensure this import exists
import { currentState } from "../Catalog/state.js";

export async function renderSortedCatalog(entries) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  try {
    const fragment = document.createDocumentFragment();
    const promoList = await getPromotions();

    let toRender = [...entries];
    if (currentState.currentSort === "default") {
      toRender.sort(() => Math.random() - 0.5); // your shuffle
    }

    for (const [sku, product] of toRender) {
      if (product.tags?.includes("Discontinued")) continue;
      const card = await createCatalogCard(sku, product, promoList);
      if (card instanceof Node) fragment.appendChild(card);
    }

    grid.innerHTML = "";
    grid.appendChild(fragment);
  } catch (err) {
    console.error("renderSortedCatalog failed:", err);
    grid.innerHTML = `<div class="text-red-600 font-bold">Failed to load products.</div>`;
  } finally {
    await clearSkeleton(grid); // ⬅️ remove the skeleton once render finishes
  }

  // non-blocking after-effects
  Promise.all([
    loadLikeData("https://api.jsonbin.io/v3/b/688826337b4b8670d8a8f0aa/latest")
      .then(() => initLikeListeners("https://hook.us2.make.com/k0uy3qgmij94koufp7enklxc5ejiby2x")),
    loadReviewStats?.("https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314/latest")
  ]).catch(() => {});
}
