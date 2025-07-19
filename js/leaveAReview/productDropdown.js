export function setupProductDropdown(products) {
  const dropdownToggle = document.getElementById("dropdownToggle");
  const dropdownList = document.getElementById("dropdownList");
  const selectedText = document.getElementById("selectedText");
  const selectedInput = document.getElementById("selectedProduct");
  const productItemsContainer = document.getElementById("productItems");
  const searchInput = document.getElementById("productSearch");
  let allProducts = [];

  dropdownToggle.addEventListener("click", () => {
    dropdownList.classList.toggle("hidden");
    searchInput.focus();
  });

  document.addEventListener("click", (e) => {
    if (!dropdownToggle.contains(e.target) && !dropdownList.contains(e.target)) {
      dropdownList.classList.add("hidden");
    }
  });

  Object.entries(products).forEach(([_, p]) => {
    const hasStock = Object.values(p.variantStock || {}).some(qty => qty > 0);
    if (!hasStock) return;

    const item = document.createElement("div");
    item.className = "product-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer bg-white shadow hover:shadow-md";
    item.dataset.name = p.name.toLowerCase();
    item.dataset.id = p.product_id.toLowerCase();
    item.innerHTML = `
      <img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-cover rounded" />
      <div class="flex flex-col w-full">
        <p class="text-sm font-medium product-name" data-original="${p.name}">${p.name}</p>
        <p class="text-xs text-gray-400 text-right product-id" data-original="${p.product_id}">${p.product_id}</p>
      </div>
    `;
    item.addEventListener("click", () => {
      selectedText.textContent = `${p.name} (${p.product_id})`;
      selectedInput.value = p.product_id;
      searchInput.value = "";
      dropdownList.classList.add("hidden");
    });

    allProducts.push(item);
    productItemsContainer.appendChild(item);
  });

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    dropdownList.classList.remove("hidden");
    productItemsContainer.innerHTML = "";

    allProducts.forEach(item => {
      const nameEl = item.querySelector(".product-name");
      const idEl = item.querySelector(".product-id");

      nameEl.textContent = nameEl.dataset.original;
      idEl.textContent = idEl.dataset.original;

      const name = item.dataset.name;
      const id = item.dataset.id;

      if (name.includes(term) || id.includes(term)) {
        if (term) {
          const highlight = (text) => text.replace(new RegExp(`(${term})`, "gi"), `<mark class="bg-yellow-200">$1</mark>`);
          nameEl.innerHTML = highlight(nameEl.textContent);
          idEl.innerHTML = highlight(idEl.textContent);
        }
        productItemsContainer.appendChild(item);
      }
    });
  });
}
