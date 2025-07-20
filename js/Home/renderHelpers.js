// 🔧 RenderHelpers — reusable HTML blocks

// Format price as USD
export function formatPrice(price) {
  return `$${(price / 100).toFixed(2)}`;
}

// 🔹 Generate the full price block (with discount logic)
export function getPriceHTML(product, activePromo) {
  const price = product.price;
  const original = formatPrice(price);

  const productCat = Array.isArray(product.category) ? product.category[0]?.toLowerCase() : product.category?.toLowerCase();
  const promoCat = activePromo?.category?.toLowerCase();

  const isPromoActive =
    activePromo &&
    promoCat &&
    productCat === promoCat &&
    (!activePromo.condition?.minPrice || price >= activePromo.condition.minPrice) &&
    (!activePromo.condition?.maxPrice || price <= activePromo.condition.maxPrice);

  if (!isPromoActive) {
    return `<span class="text-black font-bold">${original}</span>`;
  }

  const discountAmount = activePromo.discountAmount || 0;
  const discountPercent = activePromo.discountPercent || 0;

  const discountedPrice = discountAmount > 0
    ? price - discountAmount
    : discountPercent > 0
      ? Math.round(price * (1 - discountPercent / 100))
      : price;

  return `
    <div class="flex flex-col items-center sm:flex-row gap-1 sm:gap-2 justify-center">
      <span class="text-sm line-through text-gray-400">${original}</span>
      <span class="text-green-700 font-bold">${formatPrice(discountedPrice)}</span>
    </div>
  `;
}
