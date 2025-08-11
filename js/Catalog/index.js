import { currentState } from './state.js';
import { getCategoryFromURL, filterByCategory } from "./filters.js";
import { setupSearch } from "./search.js";
import { setupSort } from "./sort.js";
import { applySearchAndSort } from "./search.js";
import { renderSkeleton } from "../Shared/skeleton.js"; // ⬅️ add this

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  // ⬅️ show skeleton immediately
  renderSkeleton(grid, { variant: 'grid-card', count: 8, aspect: 'aspect-[4/5]', minDuration: 250 });

  try {
    // ... your existing fetch + setup code ...
    // (unchanged from the last version I sent)

    // 🔃 Load product catalog
    const res = await fetch("/products/products.json", { cache: "no-store" });
    const products = await res.json();
    const entries = Object.entries(products);
    window.allProducts = products;

    // 🔗 External data sources
    const LIKE_URL = "https://api.jsonbin.io/v3/b/688826337b4b8670d8a8f0aa/latest";
    const REVIEWS_URL = "https://api.jsonbin.io/v3/b/6842b73d8561e97a50204314/latest";

    // ⏱️ Fetch likes + reviews concurrently
    const [likeRes, reviewRes] = await Promise.all([
      fetch(LIKE_URL,   { cache: "no-store" }),
      fetch(REVIEWS_URL,{ cache: "no-store" })
    ]);

    // 👍 Likes → { "KK-####": likes }
    let likeMap = {};
    if (likeRes.ok) {
      const likeData  = await likeRes.json();
      const likeArray = likeData?.record?.products || likeData?.products || [];
      for (const entry of likeArray) {
        if (!entry?.key) continue;
        likeMap[entry.key] = entry?.value?.likes ?? 0;
      }
    } else {
      console.warn("Likes fetch failed:", likeRes.status);
    }
    currentState.likeMap = likeMap;

    // ⭐ Reviews → build count and avg maps
    let reviewCountMap = {};
    let reviewAvgMap = {};
    if (reviewRes.ok) {
      const reviewData = await reviewRes.json();
      const reviews    = reviewData?.record?.reviews || reviewData?.reviews || [];
      const sums = {}; // { pid: sumOfRatings }

      for (const r of reviews) {
        const pid = (r?.productId || r?.product_id || "").trim();
        const rating = Number(r?.rating);
        if (!pid || !Number.isFinite(rating)) continue;
        reviewCountMap[pid] = (reviewCountMap[pid] || 0) + 1;
        sums[pid] = (sums[pid] || 0) + rating;
      }

      for (const pid of Object.keys(reviewCountMap)) {
        const count = reviewCountMap[pid];
        reviewAvgMap[pid] = count ? Math.round((sums[pid] / count) * 10) / 10 : 0;
      }
    } else {
      console.warn("Reviews fetch failed:", reviewRes.status);
    }
    currentState.reviewCountMap = reviewCountMap;
    currentState.reviewAvgMap = reviewAvgMap;

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
    ? banners[Math.floor(Math.random() * (banners.length))]
    : defaultBanner;

  if (bannerSection) bannerSection.style.backgroundImage = `url('${banner}')`;
  if (bannerTitle) bannerTitle.textContent = formatCategoryTitle(category);
}

function formatCategoryTitle(cat) {
  if (!cat || cat === "all") return "Shop All";
  return "Shop " + cat.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
