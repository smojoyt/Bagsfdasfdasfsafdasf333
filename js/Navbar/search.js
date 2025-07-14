export function setupMenuSearch() {
  const input = document.getElementById("menu-search");
  const list = document.getElementById("menu-links");
  if (!input || !list) return;

  const items = Array.from(list.querySelectorAll("li"));

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape special chars
    return text.replace(
      new RegExp(`(${escapedTerm})`, "gi"),
      `<mark class="bg-yellow-200 font-bold">$1</mark>`
    );
  };

  const filterMenuItems = (query) => {
    const term = query.trim().toLowerCase();
    items.forEach((li) => {
      const link = li.querySelector("a");
      const text = link?.textContent || "";
      const match = text.toLowerCase().includes(term);

      li.style.display = match ? "" : "none";
      link.innerHTML = match ? highlightMatch(text, term) : text;
    });
  };

  // Debounce input handling
  let debounceTimer;
  const debounceDelay = 200;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => filterMenuItems(input.value), debounceDelay);
  });
}
