export async function renderReviewSort(onProductSelect) {
  const container = document.getElementById("review-sort-container");
  if (!container) return;

  try {
    const res = await fetch("/products/products.json");
    const products = await res.json();
    const entries = Object.entries(products);

    // 🔹 UI Elements
    container.innerHTML = `
      <button id="dropdownBtn" type="button"
        class="w-full border  px-4 py-2 text-left bg-white shadow-sm flex justify-between items-center focus:outline-none">
        <span id="dropdownLabel">Select a product</span>
        <svg class="w-4 h-4 ml-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div id="dropdownPanel" class="absolute z-50 mt-2 w-full bg-white border  shadow-lg hidden">
        <div class="p-2">
          <input type="text" id="productSearchInput" placeholder="Search products..."
            class="w-full px-3 py-2 border  text-sm focus:outline-none" />
        </div>
        <div id="dropdownList" class="max-h-64 overflow-y-auto">
          <!-- Options injected here -->
        </div>
      </div>
    `;

    const dropdownBtn = container.querySelector("#dropdownBtn");
    const dropdownPanel = container.querySelector("#dropdownPanel");
    const searchInput = container.querySelector("#productSearchInput");
    const dropdownList = container.querySelector("#dropdownList");
    const dropdownLabel = container.querySelector("#dropdownLabel");

    // 🔹 All entries, plus "All Products"
    const allOptions = [
      {
        product_id: "",
        name: "All Products",
        catalogImage: "/imgs/placeholder.jpg"
      },
      ...entries.map(([_, p]) => p)
    ];

    function renderOptions(filter = "") {
      dropdownList.innerHTML = "";
      const filtered = allOptions.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach(p => {
        const row = document.createElement("div");
        row.className =
          "flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer";
        row.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="${p.catalogImage || '/imgs/placeholder.jpg'}" alt="${p.name}" class="w-8 h-8 object-contain " />
            <span class="text-sm text-gray-800">${p.name}</span>
          </div>
          <span class="text-xs text-gray-500">${p.product_id}</span>
        `;

        row.addEventListener("click", () => {
          dropdownLabel.textContent = p.name;
          dropdownPanel.classList.add("hidden");
          onProductSelect(p.product_id || null);
        });

        dropdownList.appendChild(row);
      });

      if (filtered.length === 0) {
        dropdownList.innerHTML = `<div class="text-sm px-4 py-2 text-gray-400">No matches found.</div>`;
      }
    }

    // 🔹 Listeners
    dropdownBtn.addEventListener("click", () => {
      dropdownPanel.classList.toggle("hidden");
    });

    searchInput.addEventListener("input", () => {
      renderOptions(searchInput.value);
    });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        dropdownPanel.classList.add("hidden");
      }
    });

    // Initial render
    renderOptions();
  } catch (err) {
    console.error("❌ Failed to load product picker:", err);
  }
}
