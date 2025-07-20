import { fetchProductData } from "./fetchData.js";
import { getActivePromo, calculatePrice } from "./priceUtils.js";
import { createFeaturedCard } from "./createFeaturedCard.js";

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
    container.innerHTML = `<div class="text-center text-gray-500 italic">No featured items available right now.</div>`;
    return;
  }

  featuredItems.forEach(({ product, sku, finalPrice, originalPrice }) => {
    const card = createFeaturedCard(product, sku, finalPrice, originalPrice);
    container.appendChild(card);
  });
}

