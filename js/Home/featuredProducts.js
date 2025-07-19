import { createFeaturedCard } from "../utils/createFeaturedCard.js";
import { attachCatalogCardHandlers } from "../utils/attachCatalogCardHandlers.js";

export async function setupFeaturedProducts() {
  const container = document.getElementById("featured-products");
  if (!container) return;

  try {
    const [productsRes, promoRes] = await Promise.all([
      fetch("/products/products.json"),
      fetch("/products/promotion.json"),
    ]);

    const products = await productsRes.json();
    const { promotions } = await promoRes.json();
    const now = new Date();

    const activePromo = promotions.find((promo) => {
      const start = new Date(promo.startDate || "2000-01-01");
      const end = new Date(promo.endDate || "9999-12-31");
      return promo.featured && now >= start && now <= end;
    });

    let filteredEntries = Object.entries(products);
    let displayCategory = null;

    if (activePromo?.category) {
      const category = activePromo.category.toLowerCase();
      displayCategory = category;
      filteredEntries = filteredEntries.filter(([_, p]) =>
        (p.tags || []).map((t) => t.toLowerCase()).includes(category)
      );

      // ✅ Update heading and link
      const categoryNameMap = {
        headwear: "Hats",
        bagaccessory: "Charms",
        bags: "Bags",
      };

      const readable = categoryNameMap[category] || category;

      const titleEl = document.getElementById("featured-title");
      if (titleEl) titleEl.textContent = `Shop ${readable}`;

      const linkEl = document.getElementById("featured-link");
      if (linkEl) {
        linkEl.href = `/products/catalog.html?category=${category}`;
        linkEl.textContent = "Shop all";
      }
    }

    const randomFive = filteredEntries.sort(() => 0.5 - Math.random()).slice(0, 5);

    const fragment = document.createDocumentFragment();
    for (const [sku, product] of randomFive) {
      const card = createFeaturedCard(sku, product);
      fragment.appendChild(card);
    }

    container.innerHTML = "";
    container.appendChild(fragment);

    attachCatalogCardHandlers(container);
  } catch (err) {
    console.warn("❌ Failed to load featured products:", err);
    container.innerHTML = `<p class="text-red-600">Failed to load featured products.</p>`;
  }
}
