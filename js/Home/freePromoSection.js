// js/Home/freePromoSection.js

async function fetchProductAndPromoConfig() {
  const [productRes, promoRes] = await Promise.all([
    fetch("/products/products.json"),
    fetch("/products/promotion.json"),
  ]);

  const products = await productRes.json();
  const { promotions } = await promoRes.json();

  // Find the active promo used for this homepage section
  const promoConfig = promotions.find(
    (p) => p.type === "home_free_promo" && p.active
  );

  return { products, promoConfig };
}

// Simple card (base price only; promo is more about selection than discount)
function createFreePromoCard(product, sku, promoConfig) {
  const imageUrl =
    (Array.isArray(product.thumbnails) && product.thumbnails[0]) ||
    product.catalogImage ||
    product.image ||
    "/imgs/placeholder.jpg";

  const price = Number(product.price) || 0;

  const badgeText =
    (promoConfig && promoConfig.shortLabel) ||
    (promoConfig && promoConfig.name) ||
    "";

  const hasBadge = badgeText.trim().length > 0;

  const card = document.createElement("div");
  card.className =
    "flex flex-col text-center items-center max-w-xs snap-start shrink-0";
  card.setAttribute("data-sku", sku);

  card.innerHTML = `
    <a href="/pages/product.html?sku=${encodeURIComponent(
      sku
    )}" class="block w-full">
      <div class="relative w-full">
        <img src="${imageUrl}" alt="${product.name}"
             class="w-full aspect-square object-cover bg-gray-100 rounded-xl" />
        ${
          hasBadge
            ? `
        <div class="absolute top-2 left-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[0.7rem] font-semibold uppercase tracking-wide">
            ${badgeText}
          </span>
        </div>`
            : ""
        }
      </div>
    </a>
    <div class="mt-2 font-medium text-base line-clamp-2">${product.name}</div>
    <div class="mt-1 text-black font-bold">$${price.toFixed(2)}</div>
  `;

  return card;
}

export async function setupFreePromoSection() {
  const featuredSection = document.getElementById("featured-products-section");
  if (!featuredSection) return;

  const { products, promoConfig } = await fetchProductAndPromoConfig();

  // If no active home_free_promo config, don't render the section
  if (!promoConfig) return;

  const media = promoConfig.media || {};
  const headline = media.headline || "Free Promo Picks";
  const linkUrl = media.linkUrl || "/pages/catalog.html";
  const caption = media.caption || "";

  // Build the section container in JS
  const section = document.createElement("section");
  section.id = "free-promo-section";
  section.className = "max-w-[108rem] mx-auto py-8";

  section.innerHTML = `
    <!-- Header row -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-2xl md:text-4xl font-extrabold text-gray-900 uppercase tracking-wide">
          ${headline}
        </h2>
        ${
          caption
            ? `<p class="text-xs md:text-sm text-gray-600 mt-1 max-w-xl">${caption}</p>`
            : ""
        }
      </div>
      <a href="${linkUrl}"
         class="text-sm md:text-base font-semibold uppercase text-gray-700 hover:text-black underline underline-offset-4">
        View All
      </a>
    </div>

    <!-- Accent divider -->
    <div class="w-24 h-1 bg-gray-300 mb-6"></div>

    <!-- Scrollable product row -->
    <div class="pb-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide">
      <div id="free-promo-products-wrapper"
           class="flex gap-4 max-w-[80rem] w-max md:max-w-full md:w-fit">
        <!-- Cards injected here -->
      </div>
    </div>
  `;

  // Insert after the featured products section
  featuredSection.insertAdjacentElement("afterend", section);

  const container = section.querySelector("#free-promo-products-wrapper");

  const skus = Array.isArray(promoConfig.productSkus)
    ? promoConfig.productSkus
    : [];

  // No SKUs configured → show a friendly empty message
  if (skus.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 italic">
        No promo items are configured yet. Check back soon!
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  skus.forEach((sku) => {
    const product = products[sku];
    if (!product) {
      console.warn(
        `[freePromoSection] No product found in products.json for sku: ${sku}`
      );
      return;
    }

    const card = createFreePromoCard(product, sku, promoConfig);
    container.appendChild(card);
  });
}
