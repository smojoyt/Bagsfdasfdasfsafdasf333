// ✅ index.js
import { currentState } from './state.js'; // ✅ CORRECT
import { getCategoryFromURL, filterByCategory } from "./filters.js";
import { setupSearch } from "./search.js";
import { setupSort } from "./sort.js";
import { applySearchAndSort } from "./search.js";


document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  try {
const res = await fetch("/products/products.json");
const products = await res.json();
const entries = Object.entries(products);

window.allProducts = products; // ✅ ADD THIS


    currentState.products = products;
    currentState.originalEntries = entries;

    const category = getCategoryFromURL();
    const filtered = filterByCategory(entries, category);
    currentState.filteredEntries = filtered;

    updateBannerAndTitle(category, filtered);
    currentState.currentSort = "default";
currentState.currentSearchQuery = "";
applySearchAndSort();


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
