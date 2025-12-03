// renderProductDetails.js
import { renderColorDotsWithLabel } from "./renderColorDotsWithLabel.js";
import { initUniversalCartHandler } from "../Cart/addToCart.js";
import {
  getPromotions,
  matchPromotion,
  calculateDiscountedPrice,
} from "../Promotions/promotions.js";

export function renderProductDetails(product, promo = null) {
  const nameEl = document.getElementById("product-name");
  const idEl = document.getElementById("product-id");
  const priceEl = document.getElementById("price-section");
  const extraSections = document.getElementById("extra-sections");
  const swatchContainer = document.getElementById("variant-swatch-container");
  const addBtn = document.getElementById("add-to-cart-btn");
  const amazonBtn = document.getElementById("amazon-btn");
  const shippingTimeEl = document.getElementById("shipping-time");


  if (!nameEl || !idEl || !priceEl || !extraSections || !swatchContainer) {
    console.warn("❌ Missing product detail DOM elements");
    return;
  }

  // 🧾 Name & ID
  nameEl.textContent = product.name;
  idEl.textContent = product.product_id || product.sku;

  // 🛒 Amazon button (only if product.amazon exists)
  if (amazonBtn) {
    const url = typeof product.amazon === "string" ? product.amazon.trim() : "";
    if (url) {
      amazonBtn.href = url;
      amazonBtn.classList.remove("hidden");
    } else {
      amazonBtn.classList.add("hidden");
      amazonBtn.removeAttribute("href");
    }
  }

  const original = product.price;
  // 🕒 Shipping time based on shipping_status
  function getShippingText(product) {
    const status = (product.shipping_status || "").toLowerCase();

    if (status === "mto") {
      // Made to order
      return "Made to order • Ships in 3–5 weeks";
    }

    // Default: in-stock quick ship
    return "Ships in 1–3 business days";
  }


  // 🔢 helper to render price section based on promo
  function renderPriceSection(activePromo) {
    const finalPrice = calculateDiscountedPrice(product, activePromo);
    const isDiscounted = finalPrice < original;

    if (isDiscounted && activePromo) {
      const badgeText =
        activePromo.type === "percent"
          ? `-${activePromo.amount}% off`
          : `-$${activePromo.amount} off`;

      priceEl.innerHTML = `
        <div class="flex flex-col gap-1">
          <p class="italic text-green-700 text-xl font-bold">
            <span class="text-3xl">$${finalPrice.toFixed(2)}</span>
            <span class="text-gray-500 line-through text-base ml-2">$${original.toFixed(2)}</span>
          </p>
          <span class="inline-block mr-2 text-sm bg-red-100 text-red-600 font-semibold px-2 py-1 rounded">
            ${badgeText}
          </span>
        </div>
      `;
    } else {
      priceEl.innerHTML = `
        <span class="italic text-green-700 text-2xl font-bold">
          $${original.toFixed(2)}
        </span>
      `;
    }
  }

  // 👉 Initial render with any passed-in promo
  renderPriceSection(promo || null);
  // 📦 Shipping Time
  if (shippingTimeEl) {
    shippingTimeEl.textContent = getShippingText(product);
  }


  // 👉 If no promo passed, resolve via shared promo logic
  if (!promo) {
    getPromotions()
      .then((promoList) => {
        const matched = matchPromotion(product, promoList);
        if (!matched) return;
        renderPriceSection(matched);
      })
      .catch((err) => {
        console.warn("⚠️ Failed to resolve promotions for product detail:", err);
      });
  }

  // 🔽 Expandable Sections
  const sections = [
    { title: "Description", list: product.descriptionList },
    { title: "Sizing Info", list: product.sizingList },
    { title: "Key Details", list: product.keyDetails },
    { title: "Care Instructions", list: product.careInstructions },
  ];

  extraSections.innerHTML = sections
    .filter((s) => Array.isArray(s.list) && s.list.length > 0)
    .map((s, i) => {
      const id = `section-${i}`;
      const isDefaultOpen = s.title === "Description";

      return `
        <div>
          <button data-toggle="${id}" class="w-full flex items-center justify-between px-4 text-sm uppercase font-bold text-gray-700 hover:bg-gray-50 transition">
            <span class="flex items-center gap-2">
              <span class="toggle-icon ${isDefaultOpen ? "text-red-500" : "text-gray-500"
        } transition-all">
                ${isDefaultOpen ? "−" : "+"}
              </span>
              ${s.title}
            </span>
          </button>
          <div id="${id}" class="toggle-content px-6 text-sm text-gray-700 ${isDefaultOpen ? "" : "hidden"
        }">
            <ul class="list-disc list-inside space-y-2">
              ${s.list.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    })
    .join("");

  // Toggle functionality
  extraSections.querySelectorAll("button[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = document.getElementById(btn.dataset.toggle);
      const icon = btn.querySelector(".toggle-icon");
      const isOpen = !content.classList.contains("hidden");
      content.classList.toggle("hidden", isOpen);
      icon.textContent = isOpen ? "+" : "−";
      icon.classList.toggle("text-red-500", !isOpen);
      icon.classList.toggle("text-gray-500", isOpen);
    });
  });

  // 🎨 Variants (Color swatches OR Style buttons)
  const nameRaw = product.custom1Name || "Color";
  const isColorish = /colou?r/i.test(nameRaw);
  const options = (product.custom1Options || "")
    .split(" | ")
    .map((s) => s.trim())
    .filter(Boolean);

  const stock = product.variantStock || {};
  const vImgs = product.variantImages || {};
  const labelText = isColorish
    ? `Choose a ${nameRaw}`
    : /\bstyle\b/i.test(nameRaw)
      ? "Select Style"
      : `Choose a ${nameRaw}`;

  // 🔒 Add-to-Cart enable/disable helpers
  function setAddEnabled(enabled) {
    if (!addBtn) return;
    addBtn.disabled = !enabled;
    addBtn.setAttribute("aria-disabled", String(!enabled));
    addBtn.classList.toggle("opacity-50", !enabled);
    addBtn.classList.toggle("cursor-not-allowed", !enabled);
  }

  function numeric(val) {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  }

  function sumVariantStock() {
    return Object.values(stock).reduce((t, v) => t + numeric(v), 0);
  }

  function getAvailableQtyForCurrentSelection() {
    // If product uses variants
    if (options.length > 0 && Object.keys(stock).length > 0) {
      const sel = swatchContainer.dataset.selectedVariant;
      if (!sel) return sumVariantStock(); // before first selection, fall back to total
      return numeric(stock?.[sel]);
    }
    // No variants — product-level quantity fallbacks
    const pQty =
      product.stock ??
      product.inventory ??
      product.quantity ??
      product.qty ??
      product.available ??
      0;
    return numeric(pQty);
  }

  function updateAddToCartAvailability() {
    const available = getAvailableQtyForCurrentSelection();
    setAddEnabled(available > 0);
  }

  function selectVariant(variant, image) {
    swatchContainer.dataset.selectedVariant = variant;

    // Clear previous selection styles
    swatchContainer
      .querySelectorAll("button.color-dot")
      .forEach((dot) =>
        dot.classList.remove("ring-4", "ring-black", "ring-offset-2")
      );
    swatchContainer.querySelectorAll("button.style-btn").forEach((b) => {
      b.classList.remove("bg-black", "text-white", "border-black");
      b.setAttribute("aria-pressed", "false");
    });

    // Apply styles to chosen
    const chosen = swatchContainer.querySelector(`[data-variant="${variant}"]`);
    if (chosen && chosen.classList.contains("color-dot")) {
      chosen.classList.add("ring-4", "ring-black", "ring-offset-2");
    } else if (chosen && chosen.classList.contains("style-btn")) {
      chosen.classList.add("bg-black", "text-white", "border-black");
      chosen.setAttribute("aria-pressed", "true");
    }

    // Swap images
    const preview = document.getElementById("product-img");
    if (preview && image) preview.src = image;
    const mobileFirstImg = document.querySelector("#carousel-track img");
    if (mobileFirstImg && image) mobileFirstImg.src = image;

    // 🔒 Update button availability after selection
    updateAddToCartAvailability();
  }

  // Build UI
  if (isColorish) {
    const dots = renderColorDotsWithLabel(
      options,
      stock,
      vImgs,
      product.product_id
    );
    swatchContainer.innerHTML = `
      <h4 id="variant-label" class="text-base md:text-lg uppercase font-extrabold text-gray-600 mb-2 tracking-wider pt-2">${labelText}</h4>
      <div class="flex gap-2 flex-wrap items-start">${dots}</div>
    `;
  } else {
    const buttons = options
      .map((opt) => {
        const inStock = numeric(stock[opt]) > 0;
        const img = vImgs[opt] || "";
        return `
          <button
            class="style-btn px-3 py-2 border rounded-md text-xs font-medium uppercase tracking-wide ${inStock ? "hover:bg-gray-50" : "opacity-40 cursor-not-allowed"
          }"
            data-variant="${opt}"
            data-image="${img}"
            data-sku="${product.product_id}"
            ${inStock ? "" : "disabled"}
            aria-pressed="false"
            title="${opt}${inStock ? "" : " - Out of Stock"}"
          >${opt}</button>
        `;
      })
      .join("");

    swatchContainer.innerHTML = `
      <h4 id="variant-label" class="text-gray-700 font-bold uppercase tracking-wider mb-2">${labelText}</h4>
      <div class="flex gap-2 flex-wrap items-center" role="group" aria-label="${labelText}">
        ${buttons}
      </div>
    `;
  }

  // Default selection (first in-stock), or none if everything OOS
  const firstAvailable =
    options.find((opt) => numeric(stock[opt]) > 0) || options[0];

  if (firstAvailable && numeric(stock[firstAvailable]) > 0) {
    selectVariant(firstAvailable, vImgs[firstAvailable] || "");
  } else {
    // No in-stock variant or no variants at all — just set button state by totals
    updateAddToCartAvailability();
  }

  // Click handler for both modes
  swatchContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button.color-dot, button.style-btn");
    if (!btn || btn.disabled) return;
    selectVariant(btn.dataset.variant, btn.dataset.image || "");
  });

  // ✅ Universal cart button logic
  initUniversalCartHandler({ root: document, productData: product });

  // 📏 Sync info height to match image section
  setTimeout(() => {
    const infoWrapper = document.getElementById("product-info-wrapper");
    const desktopImages = document.getElementById("desktop-images");
    const mobileCarousel = document.getElementById("mobile-carousel");
    if (!infoWrapper) return;

    const isMobile = window.innerWidth < 1024;
    const imageSection = isMobile ? mobileCarousel : desktopImages;
    if (imageSection) {
      infoWrapper.style.minHeight = `${imageSection.offsetHeight}px`;
    }
  }, 50);
}
