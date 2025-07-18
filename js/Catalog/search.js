// ✅ search.js
import { currentState } from './state.js'; // ✅ CORRECT

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

export function applySearchAndSort() {
  // 🔥 Always start fresh from original unfiltered order
  let entries = [...currentState.originalEntries];

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
    case "default":
    default:
      // ✅ no sort — keep original order
      break;
  }

  currentState.filteredEntries = entries;
  renderSortedCatalog(entries);
}
