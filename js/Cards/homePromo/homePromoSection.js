import { createHomePromoCard } from "./homePromoCard.js";
import { getPromotions } from "../../Promotions/promotions.js";

export async function renderHomePromoSection(container, maxToShow = 6) {
  if (!container) return;

  let products = {};
  try {
    const res = await fetch("/products/products.json");
    products = await res.json();
  } catch (err) {
    console.error("❌ Failed to load products.json:", err);
    return;
  }

  const promoList = await getPromotions();
  const now = new Date();

  // 🎯 Get active promo category or fallback to random selection
  let promoCategories = [];
  const activePromo = promoList.find(promo => {
    const start = new Date(promo.startDate || "2000-01-01");
    const end = new Date(promo.endDate || "9999-12-31");
    return promo.active && now >= start && now <= end && promo.category;
  });

  if (activePromo?.category) {
    promoCategories = [activePromo.category.toLowerCase()];
  } else {
    console.warn("⚠️ No active promo. Using fallback categories.");
    promoCategories = ["headwear", "charms", "bags"]; // 🔄 Your fallback categories
  }

  // 🎯 Filter products by category AND exclude discontinued
  const matchedEntries = Object.entries(products).filter(([_, product]) => {
    const category = Array.isArray(product.category) ? product.category[0] : product.category;
    const tags = product.tags?.map(t => t.toLowerCase()) || [];

    return (
      promoCategories.includes(category?.toLowerCase()) &&
      !tags.includes("discontinued")
    );
  });

  if (matchedEntries.length === 0) {
    console.warn("⚠️ No products found for selected categories:", promoCategories);
    return;
  }

  // 🔀 Shuffle to pick random entries
  const shuffled = matchedEntries.sort(() => 0.5 - Math.random());
  const entriesToRender = shuffled.slice(0, maxToShow);

  for (const [sku, product] of entriesToRender) {
    const card = await createHomePromoCard(sku, product);
    container.appendChild(card);
  }
}

// ✅ Auto-run
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("homePromoSection");
  if (!container) return;

  await renderHomePromoSection(container, 5);
});
