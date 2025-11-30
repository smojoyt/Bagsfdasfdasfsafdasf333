// js/Navbar/cart.js
import { getCartWithPromos } from "../Promotions/index.js";
import {
  getCart,
  saveCart,
  updateCartCount,
  observeCart,
  animateQuantityChange,
} from "./cartState.js";
import { openPromoModalFromSuggestion } from "./cartPromoModal.js";

const checkoutBtn = document.getElementById("checkoutBtn");

// Stripe checkout
checkoutBtn?.addEventListener("click", async () => {
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Redirecting...";
  try {
    await window.triggerStripeCheckout();
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Checkout";
  }
});

// === Re-export state helpers so existing imports keep working ===
export { getCart, saveCart, updateCartCount, observeCart };

// ===== Cart rendering =====

export async function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  const emptyMsg = document.getElementById("cart-empty");
  const subtotalEl = document.getElementById("cart-subtotal");
  const footer = document.getElementById("cart-footer");

  if (!container || !emptyMsg || !subtotalEl || !footer) return;

  const rawCart = getCart();

  let promoCart = rawCart;
  let subtotal = 0;
  let bogoSuggestion = null;

  try {
    const result = await getCartWithPromos(rawCart);
    promoCart = result.cart;
    subtotal = result.subtotal;
    bogoSuggestion = result.bogoSuggestion || null;
  } catch (err) {
    console.error("⚠️ Failed to compute cart promos, falling back to raw cart:", err);
    promoCart = rawCart;
    subtotal = promoCart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
    bogoSuggestion = null;
  }

  container.innerHTML = "";

  if (!promoCart.length) {
    emptyMsg.classList.remove("hidden");
    footer.classList.add("hidden");
    subtotalEl.textContent = "$0.00";

    const progressContainer = document.getElementById("free-shipping-progress");
    if (progressContainer) progressContainer.classList.add("hidden");
    return;
  }

  emptyMsg.classList.add("hidden");
  footer.classList.remove("hidden");

  // Group by sku + variant, merging promo-split lines
  const groups = new Map();

  promoCart.forEach((item) => {
    const key = `${item.sku}::${item.variant || ""}`;
    const basePrice =
      typeof item.originalPrice === "number"
        ? item.originalPrice
        : item.price || 0;

    if (!groups.has(key)) {
      groups.set(key, {
        sku: item.sku,
        variant: item.variant || "",
        name: item.name,
        image: item.image,
        quantity: 0,
        freeQty: 0,
        paidQty: 0,
        unitPrice: basePrice,
        paidTotal: 0,
        hasFree: false,
      });
    }

    const g = groups.get(key);
    const q = item.quantity || 1;
    const isFree = item.isPromoFree === true;

    g.quantity += q;
    if (basePrice) g.unitPrice = basePrice;

    if (isFree) {
      g.freeQty += q;
      g.hasFree = true;
    } else {
      g.paidQty += q;
      g.paidTotal += g.unitPrice * q;
    }
  });

  const groupedItems = Array.from(groups.values());
  const frag = document.createDocumentFragment();

  groupedItems.forEach((item) => {
    const qty = item.quantity || 1;
    const freeQty = item.freeQty || 0;
    const paidQty = item.paidQty || 0;
    const unitPrice = item.unitPrice || 0;
    const lineTotal = item.paidTotal || 0;
    const hasDiscount = item.hasFree && freeQty > 0;

    const variant = item.variant
      ? `<div class="text-xs text-gray-500 italic">Variant: ${item.variant}</div>`
      : "";

    const promoBadge = hasDiscount
      ? `<div class="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-emerald-600 text-[10px] font-bold uppercase tracking-wide text-white">
           BOGO APPLIED
         </div>`
      : "";

    let priceHtml;
    if (lineTotal === 0 && hasDiscount) {
      priceHtml = `
        <span class="text-emerald-600 text-lg font-semibold">FREE</span>
        <span class="line-through text-gray-400 text-xs ml-1">
          $${(unitPrice * qty).toFixed(2)}
        </span>
      `;
    } else if (hasDiscount) {
      priceHtml = `
        <span class="text-emerald-600 font-semibold">$${lineTotal.toFixed(2)}</span>
        <span class="line-through text-gray-400 text-xs ml-1">
          $${(unitPrice * qty).toFixed(2)}
        </span>
      `;
    } else {
      priceHtml = `$${lineTotal.toFixed(2)}`;
    }

    const discountText =
      hasDiscount && freeQty > 0
        ? lineTotal === 0
          ? `${freeQty} FREE`
          : `${freeQty} FREE + ${paidQty} AT $${unitPrice.toFixed(2)} EACH`
        : "";

    const discountLine =
      discountText
        ? `<div class="text-xs text-emerald-700 mt-1 font-semibold uppercase">
             ${discountText}
           </div>`
        : "";

    const line = document.createElement("div");
    line.className = "border-b pb-4 flex items-start gap-4 relative";
    line.innerHTML = `
      <div class="relative w-20 h-20 shrink-0">
        <img src="${item.image || "/imgs/placeholder.jpg"}"
             alt="${item.name || "Item"}"
             class="w-full h-full object-cover rounded" />
        <button
          class="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow remove-item"
          data-sku="${item.sku}"
          data-variant="${item.variant || ""}"
          aria-label="Remove ${item.name || "item"}"
        >
          ×
        </button>
      </div>
      <div class="flex-grow">
        <div class="font-semibold">${item.name || "Unnamed Item"}</div>
        ${variant}
        ${promoBadge}

        <div class="mt-3 flex items-center justify-between w-full">
          <div class="flex items-center gap-2 text-sm border rounded overflow-hidden">
            <button
              class="qty-btn px-3 py-1 bg-gray-100 hover:bg-gray-200"
              data-action="decrease"
              data-sku="${item.sku}"
              data-variant="${item.variant || ""}"
              aria-label="Decrease quantity"
            >−</button>
            <span class="font-medium quantity-count px-2">${qty}</span>
            <button
              class="qty-btn px-3 py-1 bg-gray-100 hover:bg-gray-200"
              data-action="increase"
              data-sku="${item.sku}"
              data-variant="${item.variant || ""}"
              aria-label="Increase quantity"
            >+</button>
          </div>
          <div class="text-base font-bold text-right ml-4 whitespace-nowrap">
            ${priceHtml}
          </div>
        </div>
        ${discountLine}
      </div>
    `;

    frag.appendChild(line);
  });

  // Dotted upsell row with modal trigger
  if (bogoSuggestion && bogoSuggestion.missingQty > 0) {
    const { type, missingQty, buyLabel, getLabel, discountPercent } =
      bogoSuggestion;

    const qtyText = missingQty === 1 ? "1 MORE" : `${missingQty} MORE`;
    const buyText = (buyLabel || "item").toUpperCase();
    const getText = (getLabel || "item").toUpperCase();
    const freeText =
      (discountPercent || 100) >= 100
        ? "FREE"
        : `${discountPercent}% OFF`;

    let mainLine;
    if (type === "buy") {
      mainLine = `ADD ${qtyText} ${buyText} TO GET ${getText} ${freeText}`;
    } else {
      mainLine = `ADD ${qtyText} ${getText} TO GET IT ${freeText}`;
    }

    const upsell = document.createElement("div");
    upsell.className =
      "mt-2 mb-2 border-2 border-dashed border-gray-300 rounded-xl px-3 py-3 flex items-center justify-between bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition";
    upsell.innerHTML = `
      <div class="flex flex-col gap-1">
        <div class="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
          ${mainLine}
        </div>
        <div class="text-[10px] text-gray-500">
          Tap to see eligible items for this promotion.
        </div>
      </div>
      <div class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-500 text-[11px] font-semibold uppercase tracking-wide text-gray-800 bg-white">
        <span>VIEW ITEMS</span>
        <span>➜</span>
      </div>
    `;

    upsell.addEventListener("click", () =>
      openPromoModalFromSuggestion(bogoSuggestion)
    );

    frag.appendChild(upsell);
  }

  container.appendChild(frag);

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  // Free shipping progress
  const progressContainer = document.getElementById("free-shipping-progress");
  const progressBar = document.getElementById("progress-bar");
  const progressMsg = document.getElementById("progress-msg");
  const threshold = 25;

  if (progressContainer && progressBar && progressMsg) {
    if (subtotal >= threshold) {
      progressContainer.classList.remove("hidden");
      progressBar.style.width = "100%";
      progressBar.classList.add("bg-green-600");
      progressMsg.textContent = "You’ve unlocked FREE shipping!";
    } else {
      const percent = Math.min(100, (subtotal / threshold) * 100);
      progressContainer.classList.remove("hidden");
      progressBar.style.width = `${percent}%`;
      progressBar.classList.remove("bg-green-600");
      progressMsg.textContent = `Spend $${(threshold - subtotal).toFixed(
        2
      )} more to unlock FREE shipping`;
    }
  }

  setupCartInteractionHandlers();
}

// ===== Interaction wiring (uses RAW cart) =====

function setupCartInteractionHandlers() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  container.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sku = btn.dataset.sku;
      const variant = btn.dataset.variant || "";
      const rawCart = getCart();

      const filtered = rawCart.filter(
        (item) =>
          !(item.sku === sku && (item.variant || "") === variant)
      );

      saveCart(filtered);
      renderCartItems();
    });
  });

  container.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const sku = btn.dataset.sku;
      const variant = btn.dataset.variant || "";
      const rawCart = getCart();

      const idx = rawCart.findIndex(
        (item) =>
          item.sku === sku && (item.variant || "") === variant
      );
      if (idx === -1) return;

      const item = rawCart[idx];
      const currentQty = item.quantity || 1;

      if (action === "increase") {
        item.quantity = currentQty + 1;
      } else if (action === "decrease") {
        if (currentQty <= 1) {
          rawCart.splice(idx, 1);
        } else {
          item.quantity = currentQty - 1;
        }
      }

      saveCart(rawCart);
      renderCartItems();

      const quantityEl = btn
        .closest(".flex.items-center.justify-between.w-full")
        ?.querySelector(".quantity-count");
      if (quantityEl) {
        animateQuantityChange(quantityEl);
      }
    });
  });
}

// kick off observer with render function
observeCart(renderCartItems);
