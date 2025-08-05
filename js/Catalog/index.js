import { currentState } from './state.js';
import { getCategoryFromURL, filterByCategory } from "./filters.js";
import { setupSearch } from "./search.js";
import { setupSort } from "./sort.js";
import { applySearchAndSort } from "./search.js";

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  try {
    // 🔃 Load product catalog
    const res = await fetch("/products/products.json");
    const products = await res.json();
    const entries = Object.entries(products);
    window.allProducts = products;

    // 👍 Load likes JSON from JSONBin
    const likeRes = await fetch('https://api.jsonbin.io/v3/b/688826337b4b8670d8a8f0aa/latest');
    const likeData = await likeRes.json();

    // 🔃 Convert likes array to { "KK-####": likes }
    const likeMap = {};
    for (const entry of likeData.record.products) {
      likeMap[entry.key] = entry.value.likes;
    }
    currentState.likeMap = likeMap;

    // 🧠 Store product and filtered state
    currentState.products = products;
    currentState.originalEntries = entries;

    const category = getCategoryFromURL();
    const filtered = filterByCategory(entries, category);
    currentState.filteredEntries = filtered;

    // 🖼️ UI updates + default sort
    updateBannerAndTitle(category, filtered);
    currentState.currentSort = "default";
    currentState.currentSearchQuery = "";
    applySearchAndSort();

    // 🔍 Setup handlers
    setupSearch();
    setupSort();
  } catch (err) {
    console.error("Failed to load catalog:", err);
    grid.innerHTML = `<div class="text-red-600 font-bold">Failed to load products.</div>`;
  }
});

function updateBannerAndTitle(category, filtered) {
  const bannerSection = document.getElementById("catalog-banner");
  const bannerTitle = document.getElementById("category-title");
  const defaultBanner = "https://www.karrykraze.com/imgs/default-category-banner.jpg";

  const banners = filtered.map(([_, p]) => p.banner).filter(Boolean);
  const banner = banners.length > 0
    ? banners[Math.floor(Math.random() * banners.length)]
    : defaultBanner;

  if (bannerSection) bannerSection.style.backgroundImage = `url('${banner}')`;
  if (bannerTitle) bannerTitle.textContent = formatCategoryTitle(category);
}

function formatCategoryTitle(cat) {
  if (!cat || cat === "all") return "Shop All";
  return "Shop " + cat.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
