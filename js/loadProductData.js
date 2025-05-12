function injectStaticSnipcartButton(product) {
    const hiddenButton = document.createElement("button");
    hiddenButton.className = "snipcart-add-item hidden";
    hiddenButton.setAttribute("data-item-id", skuFromURL);
    hiddenButton.setAttribute("data-item-name", product.name);
    hiddenButton.setAttribute("data-item-price", (
        product.tags?.includes("Onsale") && product.sale_price < product.price
            ? product.sale_price
            : product.price
    ).toFixed(2));
    hiddenButton.setAttribute("data-item-url", window.location.origin + window.location.pathname);
    hiddenButton.setAttribute("data-item-image", product.image);
    hiddenButton.setAttribute("data-item-description", product.descriptionList?.join(" | ") || product.description);

    if (product.custom1Name && product.custom1Options) {
        hiddenButton.setAttribute("data-item-custom1-name", product.custom1Name);
        hiddenButton.setAttribute("data-item-custom1-options", product.custom1Options);
        hiddenButton.setAttribute("data-item-custom1-value", product.custom1Value || product.custom1Options.split("|")[0].trim());
    }

    hiddenButton.setAttribute("data-item-custom2-name", "Original Price");
    hiddenButton.setAttribute("data-item-custom2-value", `$${product.price.toFixed(2)}`);
    hiddenButton.setAttribute("data-item-custom2-type", "readonly");

    document.body.appendChild(hiddenButton);
}


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
                // Required base fields
                btn.setAttribute("data-item-id", skuFromURL);
                btn.setAttribute("data-item-name", activeProduct.name);
                btn.setAttribute("data-item-price", (
                    activeProduct.tags?.includes("Onsale") &&
                        activeProduct.sale_price < activeProduct.price
                        ? activeProduct.sale_price
                        : activeProduct.price
                ).toFixed(2));
                btn.setAttribute("data-item-url", window.location.origin + window.location.pathname);
                btn.setAttribute("data-item-image", activeProduct.image);
                btn.setAttribute("data-item-description",
                    activeProduct.descriptionList
                        ? activeProduct.descriptionList.join(" | ")
                        : activeProduct.description
                );

                // ✅ Variant as custom1
                if (activeProduct.custom1Name && activeProduct.custom1Options) {
                    btn.setAttribute("data-item-custom1-name", activeProduct.custom1Name); // e.g. "Color"
                    btn.setAttribute("data-item-custom1-options", activeProduct.custom1Options); // "Pink|White"
                    btn.setAttribute("data-item-custom1-value", activeProduct.custom1Value || "Pink");
                }

                // ✅ Original price as custom2 (readonly)
                btn.setAttribute("data-item-custom2-name", "Original Price");
                btn.setAttribute("data-item-custom2-value", `$${activeProduct.price.toFixed(2)}`);
                btn.setAttribute("data-item-custom2-type", "readonly");
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

            injectStaticSnipcartButton(activeProduct);

        });
}


