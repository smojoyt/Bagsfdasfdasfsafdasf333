// ✅ filters.js
export function getCategoryFromURL() {
  const params = new URLSearchParams(location.search);
  return params.get("category") || "all";
}

export function filterByCategory(entries, category) {
  if (!category || category === "all") return entries;
  return entries.filter(([_, p]) =>
    (p.tags || []).map(tag => tag.toLowerCase()).includes(category.toLowerCase())
  );
}