export function setupProductDropdown(products) {
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownList = document.getElementById("dropdownList");
  const selectedText = document.getElementById("selectedText");
  const selectedInput = document.getElementById("selectedProduct");
  const productItemsContainer = document.getElementById("productItems");
  const searchInput = document.getElementById("productSearch");

  if (!dropdownToggle || !dropdownList || !selectedText || !selectedInput || !productItemsContainer || !searchInput) {
    console.warn("⚠️ Missing dropdown elements. Check IDs.");
    return;
  }

  // Accessibility
  dropdownToggle.setAttribute("aria-haspopup", "listbox");
  dropdownToggle.setAttribute("aria-expanded", "false");
  dropdownList.setAttribute("role", "listbox");

  const open = () => {
    dropdownList.classList.remove("hidden");
    dropdownToggle.setAttribute("aria-expanded", "true");
    // Make sure on top
    dropdownList.classList.remove("z-10");
    dropdownList.classList.add("z-50");
    // Focus search after open
    setTimeout(() => searchInput.focus({ preventScroll: true }), 0);
  };

  const close = () => {
    dropdownList.classList.add("hidden");
    dropdownToggle.setAttribute("aria-expanded", "false");
  };

  const isOpen = () => !dropdownList.classList.contains("hidden");

  // Prevent "open then immediately close" due to outside-click
  dropdownToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (!dropdownList.contains(e.target) && !dropdownToggle.contains(e.target)) {
      close();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) close();
  });

  // Keyboard open with ArrowDown on toggle
  dropdownToggle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && !isOpen()) {
      e.preventDefault();
      open();
    }
  });

  // Build items (show all products)
  const allItems = [];
  const px = (n) => `${n}px`;
  const fallbackImg =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="; // 1x1 transparent

  Object.entries(products).forEach(([_, p]) => {
    const name = p?.name || "Untitled";
    const pid = p?.product_id || "";
    const img = p?.image || p?.catalogImage || fallbackImg;

    const item = document.createElement("button");
    item.type = "button";
    item.className =
      "product-item w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer bg-white";
    item.setAttribute("role", "option");
    item.dataset.name = name.toLowerCase();
    item.dataset.id = pid.toLowerCase();
    item.dataset.productId = pid;

    item.innerHTML = `
      <img src="${img}" alt="${name}" class="w-10 h-10 object-cover rounded" />
      <div class="flex flex-col w-full">
        <p class="text-sm font-medium product-name" data-original="${name}">${name}</p>
        <p class="text-xs text-gray-400 text-right product-id" data-original="${pid}">${pid}</p>
      </div>
    `;

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedText.textContent = `${name} (${pid})`;
      selectedText.classList.remove("text-gray-500");
      selectedInput.value = pid;
      searchInput.value = "";
      close();
    });

    allItems.push(item);
    productItemsContainer.appendChild(item);
  });

  // Search + highlight
  const highlight = (text, term) =>
    text.replace(new RegExp(`(${term})`, "gi"), `<mark class="bg-yellow-200">$1</mark>`);

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!isOpen()) open();

    productItemsContainer.innerHTML = "";

    allItems.forEach((item) => {
      const nameEl = item.querySelector(".product-name");
      const idEl = item.querySelector(".product-id");
      const origName = nameEl.dataset.original;
      const origId = idEl.dataset.original;

      // Reset
      nameEl.textContent = origName;
      idEl.textContent = origId;

      const name = item.dataset.name;
      const id = item.dataset.id;

      const match = !term || name.includes(term) || id.includes(term);
      if (match) {
        if (term) {
          nameEl.innerHTML = highlight(origName, term);
          idEl.innerHTML = highlight(origId, term);
        }
        productItemsContainer.appendChild(item);
      }
    });

    // Keep list clickable even if few results
    if (!productItemsContainer.style.minHeight) {
      productItemsContainer.style.minHeight = px(48);
    }
  });
}
