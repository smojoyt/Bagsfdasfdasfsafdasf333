// js/Home/featuredSection.js

// --- Data helpers (from fetchData.js) -------------------------

async function fetchProductData() {
  const [productRes, promoRes] = await Promise.all([
    fetch("/products/products.json"),
    fetch("/products/promotion.json"),
  ]);

  const products = await productRes.json();
  const { promotions } = await promoRes.json();
  return { products, promotions };
}

// --- Promo + pricing helpers (from priceUtils.js) ------------

function getActivePromo(product, promotions) {
  const now = new Date();
  const productCategory = (
    Array.isArray(product.category) ? product.category[0] : product.category
  )?.toLowerCase();

  return promotions.find((promo) => {
    const promoCategory = promo.category?.toLowerCase();
    const start = new Date(promo.startDate || "2000-01-01");
    const end = new Date(promo.endDate || "9999-12-31");
    return (
      promoCategory === productCategory &&
      now >= start &&
      now <= end
    );
  });
}

function calculatePrice(product, promo) {
  let finalPrice = Number(product.price) || 0;
  let originalPrice = null;

  if (promo && typeof promo.amount === "number") {
    originalPrice = finalPrice;

    if (promo.type === "percent") {
      finalPrice = finalPrice * (1 - promo.amount / 100);
    } else if (promo.type === "fixed") {
      finalPrice = Math.max(0, finalPrice - promo.amount);
    }
  }

  return { finalPrice, originalPrice };
}

// --- Card component (from createFeaturedCard.js) -------------

function createFeaturedCard(product, sku, finalPrice, originalPrice) {
  // You can swap this to product.thumbnails[0] if you want consistency
  const imageUrl =
    (Array.isArray(product.thumbnails) && product.thumbnails[0]) ||
    product.catalogImage ||
    product.image ||
    "/imgs/placeholder.jpg";

  const priceHTML = originalPrice
    ? `<span class="line-through text-gray-400 text-sm mr-1">$${originalPrice.toFixed(
        2
      )}</span>
       <span class="text-green-700 font-bold">$${finalPrice.toFixed(
         2
       )}</span>`
    : `<span class="text-black font-bold">$${finalPrice.toFixed(2)}</span>`;

  const card = document.createElement("div");
  card.className = "flex flex-col text-center items-center max-w-xs";
  card.setAttribute("data-sku", sku);
  card.innerHTML = `
    <a href="/pages/product.html?sku=${sku}" class="block w-full">
      <img src="${imageUrl}" alt="${product.name}"
           class="w-full aspect-square object-cover bg-gray-100" />
    </a>
    <div class="mt-2 font-medium text-base">${product.name}</div>
    <div class="mt-1">${priceHTML}</div>
  `;
  return card;
}

// --- Public section entry (from setupFeaturedProducts.js) ----

export async function setupFeaturedProducts() {
  const container = document.getElementById("featured-products");
  if (!container) return;

  const { products, promotions } = await fetchProductData();

  const featuredItems = [];

  for (const [sku, product] of Object.entries(products)) {
    const promo = getActivePromo(product, promotions);
    const { finalPrice, originalPrice } = calculatePrice(product, promo);

    featuredItems.push({ product, sku, finalPrice, originalPrice });

    if (featuredItems.length >= 5) break;
  }

  if (featuredItems.length === 0) {
    container.innerHTML = `<div class="text-center text-gray-500 italic">
      No featured items available right now.
    </div>`;
    return;
  }

  container.innerHTML = "";
  featuredItems.forEach(({ product, sku, finalPrice, originalPrice }) => {
    const card = createFeaturedCard(product, sku, finalPrice, originalPrice);
    container.appendChild(card);
  });
}
