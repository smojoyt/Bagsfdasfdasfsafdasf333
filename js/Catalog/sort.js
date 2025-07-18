// ✅ sort.js
import { currentState } from './state.js'; // ✅ CORRECT
import { applySearchAndSort } from "./search.js";

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

    applySearchAndSort();
  });
}