export const currentState = {
  products: {},
  originalEntries: [],
  filteredEntries: [],
  currentSort: "default",
  currentSearchQuery: "",
  likeMap: {} // ✅ Make sure this is here
};

// ✅ Allow debugging from DevTools
window.currentState = currentState;
