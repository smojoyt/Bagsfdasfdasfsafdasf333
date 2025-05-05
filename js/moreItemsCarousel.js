function getCompactPriceHTML(product) {
    const regular = product.price;
    const sale = product.sale_price ?? regular;
    const isOnSale = product.tags?.includes("Onsale") && sale < regular;

    if (isOnSale) {
        return `
            <div class="flex flex-col items-center gap-1">
                <div class="text-red-600 font-bold text-sm">
                    $${sale.toFixed(2)}
                    <span class="text-xs text-gray-500 line-through ml-1">$${regular.toFixed(2)}</span>
                </div>
                <div class="bg-red-100 text-red-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    On Sale
                </div>
            </div>
        `;
    } else {
        return `<div class="text-sm text-gray-600">$${regular.toFixed(2)}</div>`;
    }
}

function initMoreItemsCarousel() {
    const carouselWrapper = document.querySelector('#pp_moreitems .carousel');
    if (!carouselWrapper) return;

    fetch('https://www.karrykraze.com/products/products.json')
        .then(res => res.json())
        .then(products => {
            const productKeys = Object.keys(products);
            for (let i = productKeys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [productKeys[i], productKeys[j]] = [productKeys[j], productKeys[i]];
            }

            productKeys.forEach(sku => {
                const product = products[sku];
                if (!product || !product.image) return;

                const cell = document.createElement('div');
                cell.className = "carousel-cell p2";

                cell.innerHTML = `
<a href="/products/${product.category}/${sku}" class="block text-gray-800 hover:text-black">
  <div class="relative overflow-hidden rounded-lg group md:hover:scale-105 transition">
    <img class="w-full object-contain rounded-t-lg transition md:group-hover:opacity-0" src="${product.image}" alt="${product.name}">
    ${product.thumbnails?.[1] ? `
      <img class="w-full object-contain absolute top-0 left-0 opacity-0 transition md:group-hover:opacity-100"
        src="${product.thumbnails[1]}" alt="Hover image">` : ''}
  </div>
  <div class="text-center mt-3">
    <div class="text-sm font-semibold truncate">${product.name}</div>
    ${getCompactPriceHTML(product)}
    ${(product.custom1Options && product.custom1Options.split("|").length > 1)
                        ? `<div class="text-[11px] text-gray-500 mt-1">More colors available</div>`
                        : ''
                    }
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
