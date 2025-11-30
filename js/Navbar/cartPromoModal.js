// js/Navbar/cartPromoModal.js

import { addToCart } from "../Cart/cartLogic.js";
import { updateCartCount } from "./cartState.js";

let modalProductsCache = null;

async function loadAllProductsForModal() {
  if (modalProductsCache) return modalProductsCache;
  const res = await fetch("/products/products.json");
  const data = await res.json();
  modalProductsCache = data || {};
  return modalProductsCache;
}

function normalizeCategory(cat) {
  if (!cat) return null;
  if (Array.isArray(cat)) return cat[0] || null;
  return String(cat);
}

function productIdOf(sku, product) {
  return (
    product?.product_id ||
    product?.productId ||
    product?.id ||
    sku
  );
}

function matchesScopeForModal(product, sku, scope) {
  if (!scope || !product) return false;

  if (scope.mode === "category") {
    const prodCat = normalizeCategory(product.category)?.toLowerCase() || "";
    const wanted = String(scope.category || "").toLowerCase();
    return prodCat && wanted && prodCat === wanted;
  }

  if (scope.mode === "product") {
    const list = (scope.productIds || []).map((id) => String(id));
    const pid = String(productIdOf(sku, product));
    return list.includes(pid);
  }

  return false;
}

function ensurePromoModalContainer() {
  let overlay = document.getElementById("promo-modal-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "promo-modal-overlay";
  overlay.className =
    "fixed inset-0 z-[999] bg-black/40 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200";
  overlay.innerHTML = `
    <div
      id="promo-modal-panel"
      class="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 transform scale-95 transition-transform duration-200 overflow-hidden"
    >
      <button
        id="promo-modal-close"
        class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
        aria-label="Close"
      >
        ×
      </button>
      <div class="px-5 pt-5 pb-4 border-b border-gray-100">
        <div id="promo-modal-title" class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          PROMO ITEMS
        </div>
        <div id="promo-modal-subtitle" class="mt-1 text-xs text-gray-500">
          These items qualify for your current promotion.
        </div>
      </div>
      <div id="promo-modal-body" class="max-h-[320px] overflow-y-auto py-3">
        <!-- items injected here -->
      </div>
      <div class="px-5 py-3 bg-gray-50 text-[11px] text-gray-500">
        Tap an item to view more details or add it directly to your cart.
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePromoModal();
    }
  });

  const closeBtn = overlay.querySelector("#promo-modal-close");
  closeBtn?.addEventListener("click", () => closePromoModal());

  return overlay;
}

function openPromoModalSkeleton() {
  const overlay = ensurePromoModalContainer();
  const panel = document.getElementById("promo-modal-panel");
  if (!overlay || !panel) return;

  overlay.classList.remove("pointer-events-none");
  overlay.classList.add("pointer-events-auto");
  overlay.style.opacity = "1";
  panel.style.transform = "scale(1)";
}

export function closePromoModal() {
  const overlay = document.getElementById("promo-modal-overlay");
  const panel = document.getElementById("promo-modal-panel");
  if (!overlay || !panel) return;

  overlay.style.opacity = "0";
  panel.style.transform = "scale(0.95)";
  overlay.classList.add("pointer-events-none");
  overlay.classList.remove("pointer-events-auto");
}

export async function openPromoModalFromSuggestion(suggestion) {
  if (!suggestion) return;

  const products = await loadAllProductsForModal();
  const scope = suggestion.type === "buy" ? suggestion.buyScope : suggestion.getScope;
  if (!scope) return;

  const entries = Object.entries(products);
  const candidates = entries.filter(([sku, product]) =>
    matchesScopeForModal(product, sku, scope)
  );

  const overlay = ensurePromoModalContainer();
  const titleEl = overlay.querySelector("#promo-modal-title");
  const subtitleEl = overlay.querySelector("#promo-modal-subtitle");
  const bodyEl = overlay.querySelector("#promo-modal-body");
  if (!titleEl || !subtitleEl || !bodyEl) return;

  const discountPercent = suggestion.discountPercent || 100;
  const freeText =
    discountPercent >= 100 ? "FREE" : `${discountPercent}% OFF`;

  if (suggestion.type === "buy") {
    titleEl.textContent = "QUALIFYING ITEMS";
    subtitleEl.textContent = `Add these ${suggestion.buyLabel || "items"} to unlock ${suggestion.getLabel || "your reward"} ${freeText}.`;
  } else {
    titleEl.textContent = "REWARD ITEMS";
    subtitleEl.textContent = `Add one of these ${suggestion.getLabel || "items"} to receive it ${freeText}.`;
  }

  bodyEl.innerHTML = "";

  if (!candidates.length) {
    bodyEl.innerHTML = `
      <div class="px-5 py-4 text-xs text-gray-500">
        No matching products found for this promotion. Please check back later.
      </div>
    `;
    openPromoModalSkeleton();
    return;
  }

  const frag = document.createDocumentFragment();

  candidates.slice(0, 12).forEach(([sku, product]) => {
    const name = product.name || sku;
    const image =
      product.catalogImage ||
      product.image ||
      "/imgs/placeholder.jpg";
    const price = typeof product.price === "number" ? product.price : null;

    let defaultVariant = "";
    if (product.variantStock && typeof product.variantStock === "object") {
      const entry = Object.entries(product.variantStock).find(
        ([, q]) => Number(q) > 0
      );
      if (entry) defaultVariant = entry[0];
    }

    const row = document.createElement("div");
    row.className =
      "w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 text-left text-sm cursor-pointer";

    row.innerHTML = `
      <div class="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
        <img
          src="${image}"
          alt="${name}"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-semibold text-gray-900 truncate">
          ${name}
        </div>
        ${
          price !== null
            ? `<div class="text-[11px] text-gray-600 mt-0.5">$${price.toFixed(
                2
              )}</div>`
            : ""
        }
      </div>
      <div class="flex flex-col items-end gap-1 text-[10px] font-semibold uppercase">
        <button
          type="button"
          class="promo-item-add px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          data-sku="${sku}"
          data-variant="${defaultVariant}"
        >
          Add
        </button>
        <button
          type="button"
          class="promo-item-view text-gray-600 hover:text-gray-900 underline"
          data-sku="${sku}"
        >
          View
        </button>
      </div>
    `;

    // click row (not Add) => view
    row.addEventListener("click", (e) => {
      if (e.target.closest(".promo-item-add")) return;
      const targetSku = row.querySelector(".promo-item-view")?.dataset.sku || sku;
      window.location.href = `/pages/product.html?sku=${encodeURIComponent(
        targetSku
      )}`;
    });

    const addBtn = row.querySelector(".promo-item-add");
    const viewBtn = row.querySelector(".promo-item-view");

    addBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const addSku = addBtn.dataset.sku;
      const variant = addBtn.dataset.variant || "";

      if (!addSku) return;

      // no safe variant? go to product page
      if (!variant && product.custom1Options) {
        window.location.href = `/pages/product.html?sku=${encodeURIComponent(
          addSku
        )}`;
        return;
      }

      const result = addToCart({
        sku: addSku,
        variant,
        name,
        price: product.price,
        originalPrice: product.price,
        image,
        quantity: 1,
      });

      if (result === "invalid") return;

      updateCartCount();

      addBtn.textContent = "Added";
      addBtn.classList.remove("bg-emerald-600", "hover:bg-emerald-700");
      addBtn.classList.add("bg-emerald-700");
      setTimeout(() => {
        addBtn.textContent = "Add";
        addBtn.classList.remove("bg-emerald-700");
        addBtn.classList.add("bg-emerald-600");
      }, 900);
    });

    viewBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const viewSku = viewBtn.dataset.sku || sku;
      window.location.href = `/pages/product.html?sku=${encodeURIComponent(
        viewSku
      )}`;
    });

    frag.appendChild(row);
  });

  bodyEl.appendChild(frag);
  openPromoModalSkeleton();
}
