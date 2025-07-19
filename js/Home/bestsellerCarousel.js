import { applyPromotionsToProducts } from "../utils/promoHelpers.js";
import { renderColorDots } from "../utils/variantHelpers.js";

export function loadBestsellerProducts() {
  Promise.all([
    fetch("/products/products.json").then((res) => res.json()),
    fetch("/products/promotion.json").then((res) => res.json()),
  ])
    .then(([products, promotionFile]) => {
      const promotions = promotionFile.promotions || [];
      const updatedProducts = applyPromotionsToProducts(products, promotions);

      const container = document.getElementById("bestseller-products");
      if (!container) return;

      container.innerHTML = "";
      container.className = "carousel"; // Flickity expects this class

      const filteredProducts = Object.values(updatedProducts)
        .filter(
          (p) =>
            p.tags?.includes("Bestseller") &&
            Object.values(p.variantStock || {}).some((qty) => qty > 0)
        )
        .slice(0, 6);

      filteredProducts.forEach((p) => {
        const stock = p.variantStock || {};
        const secondThumbnail = p.thumbnails?.[1] || p.image;
        const inStockColors = Object.keys(stock).filter((variant) => stock[variant] > 0);
        const swatchString = inStockColors.join("|");

        const originalPrice = p.price;
        const salePrice = p.sale_price || originalPrice;

        const wrapper = document.createElement("div");
        wrapper.className = "pr-3 carousel-cell w-[75%] sm:w-[55%] md:w-[22rem]";

        const card = document.createElement("a");
        card.href = p.url;
        card.className = `block overflow-hidden transition`;

        card.innerHTML = `
          <div class="relative w-full bg-white rounded-xl">
            <img src="${secondThumbnail}" alt="${p.name}" class="shadow hover:shadow-lg w-full object-contain">
            ${
              inStockColors.length > 1
                ? `<div class="absolute bottom-2 left-2 flex gap-1">
                     ${renderColorDots(swatchString, p.variantStock)}
                   </div>`
                : ""
            }
          </div>
          <div class="mt-4 text-left">
            <div class="text-base sm:text-lg md:text-xl font-bold text-gray-800 leading-snug break-words">${p.name}</div>
            <div class="mt-1 text-lg font-bold text-green-700">
              $${salePrice.toFixed(2)}
              ${
                salePrice < originalPrice
                  ? `<span class="ml-2 text-gray-500 line-through text-base">$${originalPrice.toFixed(
                      2
                    )}</span>`
                  : ""
              }
            </div>
          </div>
        `;

        wrapper.appendChild(card);
        container.appendChild(wrapper);
      });

      imagesLoaded(container, () => {
        const flickity = new Flickity(container, {
          cellAlign: "left",
          contain: true,
          groupCells: 1,
          freeScroll: true,
          wrapAround: false,
          prevNextButtons: false,
          pageDots: false,
          dragThreshold: 5,
        });
        flickity.resize();
      });
    });
}
