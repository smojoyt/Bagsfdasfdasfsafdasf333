// ✅ search.js
import { currentState } from './state.js';
import { renderSortedCatalog } from "./render.js";

export function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!searchInput || !clearBtn) return;

  searchInput.addEventListener("input", () => {
    currentState.currentSearchQuery = searchInput.value.trim();
    applySearchAndSort();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentState.currentSearchQuery = "";
    applySearchAndSort();
  });
}

// ⬅️ NEW: comparator for rating sorts (avg first, then review count)
// highFirst=true → High→Low, otherwise Low→High
function compareByRating([skuA, prodA], [skuB, prodB], highFirst = true) {
  const pidA = prodA.product_id || prodA.productId || "";
  const pidB = prodB.product_id || prodB.productId || "";

  const avgA = currentState.reviewAvgMap[pidA] ?? 0;
  const avgB = currentState.reviewAvgMap[pidB] ?? 0;
  const cntA = currentState.reviewCountMap[pidA] ?? 0;
  const cntB = currentState.reviewCountMap[pidB] ?? 0;

  // primary: average rating
  if (avgA !== avgB) return highFirst ? (avgB - avgA) : (avgA - avgB);

  // tie-breaker: review count
  if (cntA !== cntB) return highFirst ? (cntB - cntA) : (cntA - cntB);

  // final tie-breaker (stable-ish): name
  return (prodA.name || "").localeCompare(prodB.name || "");
}

export function applySearchAndSort() {
  // ✅ Start from category-filtered entries
  let entries = [...currentState.filteredEntries];

  // 🔍 Apply search filter (if any)
  const query = currentState.currentSearchQuery.toLowerCase();
  if (query) {
    entries = entries.filter(([_, p]) =>
      p.name.toLowerCase().includes(query)
    );
  }

  // 🔃 Apply sorting
  switch (currentState.currentSort) {
    case "price-low":
      entries.sort((a, b) => a[1].price - b[1].price);
      break;
    case "price-high":
      entries.sort((a, b) => b[1].price - a[1].price);
      break;
    case "alphabetical":
      entries.sort((a, b) => a[1].name.localeCompare(b[1].name));
      break;
    case "rating-high": // ⬅️ NEW
      entries.sort((a, b) => compareByRating(a, b, true));
      break;
    case "rating-low": // ⬅️ NEW
      entries.sort((a, b) => compareByRating(a, b, false));
      break;
    case "default":
    default:
      // No sort needed — keep original category-filtered order
      break;
  }

  renderSortedCatalog(entries);
}
