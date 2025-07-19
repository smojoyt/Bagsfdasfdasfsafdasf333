import { currentState } from "./state.js";
import { renderColorDots } from "../utils/variantHelpers.js";
import { updateCartCount } from "../Navbar/cart.js";

export function renderSortedCatalog(entries) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const [key, product] of entries) {
    if (product.tags?.includes("Discontinued")) continue;

    const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";
    const hoverImage = product.catalogImageHover || imageUrl;

    const colorOptions = Array.isArray(product.custom1Options)
      ? product.custom1Options
      : typeof product.custom1Options === "string"
        ? product.custom1Options.split(" | ")
        : [];

    const card = document.createElement("div");
    card.className = "flex flex-col gap-2 w-full max-w-[30rem] items-center text-center";

    card.innerHTML = `
  <div class="w-full">
    <a href="/products/${key}.html" class="block w-full" data-sku="${key}">
      <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
        <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
        <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </a>
    <div class="flex flex-col items-center gap-0.5 text-sm mt-5">
      <div class="font-medium text-black uppercase">
        ${highlightMatch(product.name, currentState?.currentSearchQuery || "")}
      </div>
      <div class="text-black">$${product.price.toFixed(2)}</div>
      <div class="flex flex-wrap justify-center gap-x-1 gap-y-1.5 mt-3 swatch-group">
        ${renderColorDots(colorOptions, product.variantStock, product.variantImages, key)}
      </div>
      <div class="text-xs mt-1 select-color-text uppercase text-gray-500 cursor-not-allowed transition-all duration-300" data-sku="${key}">
        Select Color
      </div>
    </div>
  </div>
`;


    fragment.appendChild(card);
  }

  grid.appendChild(fragment);

  // ✅ ONE clean event listener for both swatches & add-to-cart
  grid.addEventListener("click", (e) => {
    const dot = e.target.closest("button.color-dot");
    const addBtn = e.target.closest(".select-color-text");

    // 🔹 Swatch clicked
if (dot) {
  const sku = dot.dataset.sku;
  const variant = dot.dataset.variant;
  const image = dot.dataset.image;

  const card = dot.closest(".flex.flex-col"); // ← the actual root card
  const msgEl = card?.querySelector(".select-color-text");

  document.querySelectorAll(`.color-dot[data-sku="${sku}"]`).forEach(btn => {
    btn.classList.remove("ring-2", "ring-black");
  });
  dot.classList.add("ring-2", "ring-black");

const img = document.querySelector(`a[data-sku="${sku}"] .image-hover-group > img`);


  if (img && image) {
    console.log("✅ Updating image:", img.src, "→", image);
    img.src = image;
  } else {
    console.warn("❌ Could not update image", { img, image });
  }

  if (msgEl) {
    msgEl.textContent = "Add to Cart";
    msgEl.dataset.variant = variant;
    msgEl.classList.remove("text-gray-500", "cursor-not-allowed");
    msgEl.classList.add("text-black", "cursor-pointer");
  }

  return;
}




    // 🔹 Add to Cart clicked
    if (addBtn && addBtn.textContent === "Add to Cart") {
      const sku = addBtn.dataset.sku;
      const variant = addBtn.dataset.variant;
      const product = window.allProducts?.[sku];
      if (!sku || !variant || !product) return;

      const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
      const found = cart.find(item => item.sku === sku && item.variant === variant);

      if (found) {
        found.quantity += 1;
      } else {
        cart.push({
          sku,
          variant,
          name: product.name,
          price: product.price,
          image: product.variantImages?.[variant] || product.image,
          quantity: 1,
        });
      }

      localStorage.setItem("savedCart", JSON.stringify(cart));
      updateCartCount();

      addBtn.textContent = "Added!";
      addBtn.classList.add("text-green-600");
      addBtn.style.opacity = "0.5";
      addBtn.style.transform = "scale(1.05)";

      setTimeout(() => {
        addBtn.textContent = "Add to Cart";
        addBtn.classList.remove("text-green-600");
        addBtn.style.opacity = "1";
        addBtn.style.transform = "scale(1)";
      }, 1000);
    }
  });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, `<span class="bg-yellow-200">$1</span>`);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
