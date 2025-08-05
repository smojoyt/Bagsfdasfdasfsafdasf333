// ✅ sort.js
import { currentState } from './state.js';
import { applySearchAndSort } from "./search.js";
import { likeCache } from '../Shared/itemLikes.js';

export function setupSort() {
  const sortToggle = document.getElementById("sortToggle");
  const sortOptions = document.getElementById("sortOptions");
  const sortLabel = document.getElementById("sortLabel");

  if (!sortToggle || !sortOptions || !sortLabel) return;

  sortToggle.addEventListener("click", () => {
    sortOptions.classList.toggle("hidden");
  });

  sortOptions.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sort]");
    if (!btn) return;

    const sortType = btn.dataset.sort;
    currentState.currentSort = sortType;
    sortLabel.textContent = btn.textContent;
    sortOptions.classList.add("hidden");

    if (sortType === "likes-low") {
      sortByLikes("low");
    } else if (sortType === "likes-high") {
      sortByLikes("high");
    } else if (sortType === "price-low") {
      sortByPrice("low");
    } else if (sortType === "price-high") {
      sortByPrice("high");
    } else {
      applySearchAndSort(); // fallback for default/alphabetical
    }
  });
}

function sortByLikes(order) {
  const likeMap = currentState.likeMap;

  const sortedItems = [...currentState.filteredEntries].sort((a, b) => {
    const productA = a[1];
    const productB = b[1];

    const likesA = likeMap[productA.product_id] || 0;
    const likesB = likeMap[productB.product_id] || 0;

    return order === "low" ? likesA - likesB : likesB - likesA;
  });

  currentState.filteredEntries = sortedItems;
  applySearchAndSort();
}



function sortByPrice(order) {
  const sortedItems = [...currentState.filteredEntries].sort((a, b) => {
    const priceA = a[1].price || 0; // a[1] = product
    const priceB = b[1].price || 0;

    return order === "low" ? priceA - priceB : priceB - priceA;
  });

  currentState.filteredEntries = sortedItems;
  applySearchAndSort();
}
