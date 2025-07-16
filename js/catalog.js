import { renderColorDots } from "./utils/variantHelpers.js";
import { saveCart, updateCartCount } from "./Navbar/cart.js";


let originalProductEntries = [];
let products = {};

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("product-grid");
  const sortToggle = document.getElementById("sortToggle");
  const sortOptions = document.getElementById("sortOptions");
  const sortLabel = document.getElementById("sortLabel");
  if (!grid) return;

  // Sorting toggle dropdownss
  sortToggle?.addEventListener("click", () => {
    sortOptions?.classList.toggle("hidden");
  });

  // Sort option click handler
  sortOptions?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sort]");
    if (!btn) return;

    const sortType = btn.dataset.sort;
    sortLabel.textContent = btn.textContent;
    sortOptions.classList.add("hidden");

    let sorted = [...originalProductEntries];
    if (sortType === "asc") {
      sorted.sort((a, b) => a[1].price - b[1].price);
    } else if (sortType === "desc") {
      sorted.sort((a, b) => b[1].price - a[1].price);
    }

    renderSortedCatalog(sorted);
  });

  try {
    const res = await fetch("/products/products.json");
    products = await res.json();
    originalProductEntries = Object.entries(products);
    renderSortedCatalog(originalProductEntries);

    // Swatch and Cart Click Handler
    grid.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-color]");
      if (btn) {
        const group = btn.closest(".swatch-group");
        if (!group) return;

        group.querySelectorAll("button").forEach(b => b.classList.remove("ring-2", "ring-black"));
        btn.classList.add("ring-2", "ring-black");

        const image = btn.dataset.image;
        const card = btn.closest("[data-sku]");
        if (!card) return;

        const imgEl = card.querySelector(".product-img");
        if (imgEl && image) imgEl.src = image;

        const variant = btn.dataset.color;
        const selectText = card.querySelector(".select-color-text");

        if (selectText && selectText.dataset.variant !== variant) {
          selectText.textContent = "Add to Cart";
          selectText.dataset.variant = variant;
          selectText.classList.remove("text-gray-500", "cursor-not-allowed");
          selectText.classList.add("text-black", "cursor-pointer", "relative", "transition-colors", "duration-300");
        }

        return;
      }

      const cartText = e.target.closest(".select-color-text");
      if (cartText && cartText.textContent === "Add to Cart") {
        const sku = cartText.dataset.sku;
        const variant = cartText.dataset.variant;
        if (!sku || !variant) return;

        const product = products[sku];
        if (!product) return;

        const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
        const existing = cart.find(item => item.sku === sku && item.variant === variant);

        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            sku,
            variant,
            name: product.name,
            price: product.price,
            image: product.variantImages?.[variant] || product.image,
            quantity: 1
          });
        }

        saveCart(cart);
        updateCartCount();

        cartText.textContent = "Added!";
        cartText.classList.add("text-green-600");
        cartText.style.transition = "all 0.2s ease";
        cartText.style.opacity = "0.5";
        cartText.style.transform = "scale(1.05)";

        setTimeout(() => {
          cartText.textContent = "Add to Cart";
          cartText.classList.remove("text-green-600");
          cartText.style.opacity = "1";
          cartText.style.transform = "scale(1)";
        }, 1000);
      }
    });
  } catch (err) {
    console.error("Failed to load catalog:", err);
    grid.innerHTML = `<div class="text-red-600 font-bold">Failed to load products.</div>`;
  }
});

function renderSortedCatalog(entries) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const [key, product] of entries) {
    if (product.tags?.includes("Discontinued")) continue;

    const imageUrl = product.catalogImage || product.image || "/imgs/placeholder.jpg";
    const hoverImage = product.catalogImageHover || imageUrl;

    const card = document.createElement("div");
    card.className = "flex flex-col gap-2 w-full max-w-[30rem] items-center text-center";

    card.innerHTML = `
      <div class="w-full" data-sku="${key}">
        <a href="/products/${key}.html" class="block w-full">
          <div class="relative w-full aspect-square bg-gray-100 overflow-hidden group image-hover-group">
            <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 product-img" />
            <img src="${hoverImage}" alt="${product.name}" class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </a>
        <div class="flex flex-col items-center gap-0.5 text-sm mt-5">
          <div class="font-medium text-black uppercase">${product.name}</div>
          <div class="text-black">$${product.price.toFixed(2)}</div>
          <div class="flex flex-wrap justify-center gap-x-1 gap-y-1.5 mt-3 swatch-group">
            ${renderColorDots(product.custom1Options, product.variantStock, product.variantImages)}
          </div>
          <div class="text-xs mt-1 select-color-text uppercase text-gray-500 cursor-not-allowed transition-all duration-300" data-sku="${key}">Select Color</div>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  }

  grid.appendChild(fragment);
}
window.addEventListener("pageshow", () => {
  updateCartCount();
});
