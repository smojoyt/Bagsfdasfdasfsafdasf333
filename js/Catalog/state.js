// ✅ state.js
export const currentState = {
  products: {},
  originalEntries: [],
  filteredEntries: [],
  currentSort: "default",
  currentSearchQuery: "",
  likeMap: {},          // existing
  reviewCountMap: {},   // ⬅️ NEW
  reviewAvgMap: {}      // ⬅️ NEW
};

// ✅ Allow debugging from DevTools
window.currentState = currentState;
