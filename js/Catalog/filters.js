// ✅ filters.js
export function getCategoryFromURL() {
  const params = new URLSearchParams(location.search);
  return params.get("category") || "all";
}

export function filterByCategory(entries, category) {
  const normalizedCategory = (category || "all").toLowerCase();

  return entries.filter(([_, p]) => {
    const tags = (p.tags || []).map(tag => tag.toLowerCase());

    // 🚫 Never show discontinued items
    if (tags.includes("discontinued")) return false;

    // 🛍️ "all" category → show everything that's not discontinued
    if (normalizedCategory === "all") return true;

    // 🎯 Specific category → tag must match
    return tags.includes(normalizedCategory);
  });
}
