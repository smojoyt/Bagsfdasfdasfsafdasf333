function loadProductData() {
    fetch("https://www.karrykraze.com/products/products.json")
        .then(res => res.json())
        .then(data => {
            const activeProduct = data[skuFromURL];
            if (!activeProduct) {
                console.error(`Product not found for SKU: ${skuFromURL}`);
                return;
            }

            const nameEl = document.getElementById("product-name");
            if (nameEl) nameEl.textContent = activeProduct.name;

            const productIdEl = document.getElementById("product-id");
            if (productIdEl && activeProduct.product_id) {
                productIdEl.textContent = activeProduct.product_id;
            }


            const priceSection = document.getElementById("price-section");
            if (priceSection) {
                priceSection.innerHTML = getFullPriceHTML(activeProduct);
            }





            const descEl = document.getElementById("product-description");
            if (descEl) {
                descEl.innerHTML = Array.isArray(activeProduct.descriptionList)
                    ? activeProduct.descriptionList.map(d => `<li>${d}</li>`).join("")
                    : `<li>${activeProduct.description}</li>`;
            }

            const imgEl = document.getElementById("mainImage");
            if (imgEl && activeProduct.image) {
                imgEl.src = activeProduct.image;
                imgEl.alt = activeProduct.name;
            }
            const btn = document.getElementById("add-to-cart-btn");
            if (btn) {
                Object.assign(btn.dataset, {
                    itemId: skuFromURL,
                    itemName: activeProduct.name,
                    itemPrice: (
                        activeProduct.tags?.includes("Onsale") &&
                            activeProduct.sale_price < activeProduct.price
                            ? activeProduct.sale_price
                            : activeProduct.price
                    ).toFixed(2),

                    itemUrl: window.location.origin + window.location.pathname,


                    itemImage: activeProduct.image,
                    itemDescription: activeProduct.descriptionList
                        ? activeProduct.descriptionList.join(" | ")
                        : activeProduct.description,
                    itemCustom1Name: activeProduct.custom1Name || "",
                    itemCustom1Options: activeProduct.custom1Options || "",
                    itemCustom2Name: "Original Price",
                    itemCustom2Value: `$${activeProduct.price.toFixed(2)}`,
                    itemCustom2Type: "readonly"
                });
            }



            const variantSelect = document.getElementById("variant-select");
            if (variantSelect && activeProduct.custom1Options) {
                variantSelect.innerHTML = "";
                const options = activeProduct.custom1Options.split("|").map(opt => opt.trim());

                options.forEach(color => {
                    const swatch = document.createElement("button");
                    swatch.className = `
            flex flex-col items-center group cursor-pointer
            focus:outline-none
        `;

                    // Warn if color not in colorMap and not a valid CSS color
                    if (!colorMap[color] && !CSS.supports("color", color.toLowerCase())) {
                        console.warn(`Missing color swatch value for "${color}"`);
                    }

                    // Create swatch HTML
                    swatch.innerHTML = `
            <div class="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-black"
                 style="background-color: ${colorMap[color] || color.toLowerCase()};"></div>
            <span class="text-xs mt-1 text-gray-700 group-hover:text-black">${color}</span>
        `;

                    // Improve accessibility for screen readers
                    swatch.setAttribute("aria-label", `${color} color`);

                    swatch.addEventListener("click", () => {
                        updateVariant(color); // now works because of updated function

                        Array.from(variantSelect.children).forEach(btn =>
                            btn.querySelector("div").classList.remove("ring", "ring-black", "ring-offset-2")
                        );
                        swatch.querySelector("div").classList.add("ring", "ring-black", "ring-offset-2");

                        if (activeProduct.variantImages?.[color]) {
                            const img = document.getElementById("mainImage");
                            if (img) img.src = activeProduct.variantImages[color];
                        }
                    });

                    variantSelect.appendChild(swatch);
                });


                // trigger default selection
                variantSelect.firstChild?.click();
            }


            const thumbnailContainer = document.getElementById("thumbnailContainer");
            if (thumbnailContainer && Array.isArray(activeProduct.thumbnails)) {
                thumbnailContainer.innerHTML = "";

                activeProduct.thumbnails.forEach((img, i) => {
                    const cell = document.createElement("div");
                    cell.className = "carousel-cell w-[100px] flex-shrink-0";

                    const thumb = document.createElement("img");
                    thumb.src = img;
                    thumb.alt = `${activeProduct.name} thumbnail ${i + 1}`;
                    thumb.className = "w-16 h-16 object-contain rounded-lg cursor-pointer";
                    thumb.onclick = () => swapImage(img);

                    cell.appendChild(thumb);
                    thumbnailContainer.appendChild(cell);
                });

                imagesLoaded(thumbnailContainer, () => {
                    const flickity = new Flickity(thumbnailContainer, {
                        cellAlign: 'left',
                        contain: true,
                        groupCells: false,
                        freeScroll: true,
                        wrapAround: false,
                        prevNextButtons: false,
                        pageDots: false,
                        dragThreshold: 3
                    });
                    flickity.resize();
                });
            }

            const loader = document.getElementById('loader');
            if (loader) loader.style.display = 'none';

            const content = document.getElementById('pageContent');
            if (content) content.classList.remove('hidden');
        });
}