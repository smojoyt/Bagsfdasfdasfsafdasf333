function getCompactPriceHTML(product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = sale < regular;

    if (isOnSale) {
        return `
            <div class="flex flex-col items-start gap-1">
                <div class="text-red-600 font-bold text-xl">
                    $${sale.toFixed(2)}
                    <span class="text-xs text-gray-500 line-through ml-1">$${regular.toFixed(2)}</span>
                </div>
                <div class="bg-red-100 text-red-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    On Sale
                </div>
            </div>
        `;
    } else {
        return `<div class=" text-xl font-bold text-gray-600 italic">$${regular.toFixed(2)}</div>`;
    }
}

function initMoreItemsCarousel() {
    const carouselWrapper = document.querySelector('#pp_moreitems .carousel');
    if (!carouselWrapper) return;

    Promise.all([
        fetch("/products/products.json").then(res => res.json()),
        fetch("/products/promotion.json").then(res => res.json())
    ])
        .then(([products, promotionFile]) => {
            const promotions = promotionFile.promotions || [];
            products = applyPromotionsToProducts(products, promotions);

            // Shuffle
            const productKeys = Object.keys(products);
            for (let i = productKeys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [productKeys[i], productKeys[j]] = [productKeys[j], productKeys[i]];
            }

            productKeys.forEach(sku => {
                const product = products[sku];
                if (!product || !product.image || product.tags?.includes("Discontinued")) return;

                const cell = document.createElement('div');
                cell.className = "carousel-cell p2";

                cell.innerHTML = `
<a href="/products/${product.category}/${sku}" class="block text-gray-800 hover:text-black">
  <div class="relative overflow-hidden rounded-2xl group md:hover:scale-105 transition">
    <img class="w-full object-contain rounded-t-2xl transition md:group-hover:opacity-0" src="${product.image}" alt="${product.name}">
    ${product.thumbnails?.[1] ? `
      <img class="w-full object-contain absolute top-0 left-0 opacity-0 transition md:group-hover:opacity-100"
           src="${product.thumbnails[1]}" alt="Hover image">` : ''}

    ${(() => {
                    const stock = product.variantStock || {};
                    const allVariants = (product.custom1Options || "")
                        .split("|")
                        .map(v => v.trim())
                        .filter(v => stock[v] > 0);

                    if (allVariants.length <= 1) return "";

                    const visibleVariants = allVariants.slice(0, 3);
                    const hiddenCount = allVariants.length - visibleVariants.length;

                    let swatchesHTML = renderColorDots(visibleVariants.join("|"), stock)
                        .replaceAll('w-6', 'w-4')
                        .replaceAll('h-6', 'h-4');

                    if (hiddenCount > 0) {
                        swatchesHTML += `<span class="ml-1 text-xs text-gray-600 font-medium">+${hiddenCount} more</span>`;
                    }

                    return `
    <div class="absolute bottom-1 left-1 flex items-left gap-[3px] z-10">
        ${swatchesHTML}
    </div>
`;

                    })()}
  </div>

  <div class="text-left mt-3">
    <div class="text-[0.9rem] font-bold whitespace-normal">${product.name}</div>
    ${getCompactPriceHTML(product)}
  </div>
</a>`;

                carouselWrapper.appendChild(cell);
            });

            imagesLoaded(carouselWrapper, () => {
                const flickity = new Flickity(carouselWrapper, {
                    cellAlign: 'left',
                    contain: true,
                    groupCells: 1,
                    freeScroll: false,
                    wrapAround: false,
                    prevNextButtons: false,
                    pageDots: false,
                    dragThreshold: 5,
                    autoPlay: 3000,
                    pauseAutoPlayOnHover: true
                });
                flickity.resize();
            });
        });
}

