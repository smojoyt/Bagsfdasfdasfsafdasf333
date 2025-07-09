function loadBundlesAndRenderCart() {
    const url = 'https://karrykraze.com/products/bundles.json';
    logCart(`📦 Fetching bundle data from: ${url}`);

    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            window.bundlesData = data;
            logCart(`✅ Bundles loaded (${data.length} items)`);
            renderCart();
        })
        .catch(err => {
            errorCart("❌ Failed to load bundles.json:", err);
            renderCart(); // fallback to cart rendering anyway
        });
}




function getAvailableBundlesForItem(item, cart) {
    const bundles = window.bundlesData || [];
    const applicableBundles = [];

    const itemId = item.id?.toLowerCase();
    const itemSub = item.subCategory?.toLowerCase();

    if (!itemId && !itemSub) {
        warnCart("Item missing ID or subCategory:", item);
        return [];
    }

    logCart(`🔍 Checking bundles for item:`, { id: itemId, subCategory: itemSub });

    for (const bundle of bundles) {
        if (!bundle.carttxt) {
            warnCart("⚠️ Skipping bundle with no 'carttxt':", bundle);
            continue;
        }

        let matches = false;

        const skus = (bundle.specificSkus || []).map(s => s.toLowerCase());
        const bundleSub = bundle.subCategory?.toLowerCase();
        const requiredSubs = (bundle.requiredSubCategories || []).map(s => s.toLowerCase());

        // ✅ Match logic
        if (skus.includes(itemId)) matches = true;
        if (bundleSub && bundleSub === itemSub) matches = true;
        if (requiredSubs.includes(itemSub)) matches = true;

        if (!matches) {
            logCart(`⛔ No match for item in bundle "${bundle.name || bundle.id}"`);
            continue;
        }

        // 🧮 Check usage limits
        let matchCount = 0;
        for (const ci of cart) {
            const ciId = ci.id?.toLowerCase();
            const ciSub = ci.subCategory?.toLowerCase();

            if (skus.includes(ciId)) matchCount += ci.qty;
            else if (bundleSub && ciSub === bundleSub) matchCount += ci.qty;
            else if (requiredSubs.includes(ciSub)) matchCount += ci.qty;
        }

        const maxAllowed = (bundle.maxUses || 1) * (bundle.minQuantity || 1);

        if (matchCount < maxAllowed) {
            logCart(`✅ Bundle "${bundle.name || bundle.id}" is eligible (in cart: ${matchCount}/${maxAllowed})`);
            applicableBundles.push(bundle);
        } else {
            logCart(`🚫 Bundle "${bundle.name || bundle.id}" already maxed out (${matchCount}/${maxAllowed})`);
        }
    }

    logCart(`📦 Applicable bundles for item "${itemId}":`, applicableBundles.map(b => b.name || b.id));
    return applicableBundles;
}




function renderCart() {
    const savedCart = localStorage.getItem("savedCart");
    let cart = [];

    try {
        cart = JSON.parse(savedCart) || [];
    } catch (e) {
        errorCart("❌ Failed to parse savedCart JSON:", e);
    }

    bundleDetector(cart).then(updatedCart => {
        cart = updatedCart;
        localStorage.setItem("savedCart", JSON.stringify(cart));
        updateCartCount();

        const cartItemsContainer = document.getElementById("cartItems");
        const cartTotalEl = document.getElementById("cartTotal");
        const freeShippingBar = document.getElementById("freeShippingBar");
        const freeShippingProgress = document.getElementById("freeShippingProgress");
        const checkoutBtn = document.getElementById("checkoutBtn");
        const emptyMsg = document.getElementById("emptyCartMessage");

        if (!cartItemsContainer || !cartTotalEl) {
            warnCart("❗ Missing cart DOM elements");
            return;
        }

        cartItemsContainer.innerHTML = "";

        // Empty cart case
        if (cart.length === 0) {
            logCart("🧺 Cart is empty");
            emptyMsg?.classList.remove("hidden");
            cartTotalEl.parentElement?.classList.add("hidden");
            freeShippingBar?.classList.add("hidden");
            freeShippingProgress?.parentElement?.classList.add("hidden");
            checkoutBtn?.classList.add("hidden");
            return;
        }

        // Show elements
        emptyMsg?.classList.add("hidden");
        cartTotalEl.parentElement?.classList.remove("hidden");
        freeShippingBar?.classList.remove("hidden");
        freeShippingProgress?.parentElement?.classList.remove("hidden");
        checkoutBtn?.classList.remove("hidden");

        let total = 0;

        for (const item of cart) {
            item.price = parseFloat(item.price ?? item.originalPrice ?? 0);
            item.originalPrice = parseFloat(item.originalPrice ?? item.price);
            if (!item.originalPrice) item.originalPrice = item.price;

            const qty = parseInt(item.qty) || 1;
            total += item.price * qty;

            const product = window.allProducts?.[item.key] || Object.values(window.allProducts || {}).find(p => p.product_id === item.id);

            // DOM Construction
            const itemEl = document.createElement("div");
            itemEl.className = "p-2 flex items-start gap-3";

            const leftCol = buildLeftColumn(product, item);
            const rightCol = buildRightColumn(product, item, qty);

            itemEl.appendChild(leftCol);
            itemEl.appendChild(rightCol);

            const cartItemWrapper = document.createElement("div");
            cartItemWrapper.className = "w-full border-b-4 border-gray-300 pb-4 last:border-none group mb-6";
            cartItemWrapper.appendChild(itemEl);

            // BUNDLE PROMPT (if eligible)
            const eligibleBundles = getAvailableBundlesForItem(item, cart);
            if (!item.bundleLabel && eligibleBundles.length > 0) {
                const bundlePrompt = buildBundlePrompt(eligibleBundles);
                cartItemWrapper.appendChild(bundlePrompt);
            }

            cartItemsContainer.appendChild(cartItemWrapper);
        }

        // Update totals
        cartTotalEl.textContent = `$${total.toFixed(2)}`;
        updateFreeShippingBar(total);

        logCart(`🛒 Cart rendered (${cart.length} items, total: $${total.toFixed(2)})`);
    });
}


function buildLeftColumn(product, item) {
    const leftCol = document.createElement("div");
    leftCol.className = "flex flex-col justify-between h-full min-w-[6rem] max-w-[6rem] items-center gap-2";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "relative w-full aspect-square";

    const img = document.createElement("img");
    img.src = product?.image || item.image || "/imgs/placeholder.png";
    img.alt = product?.name || item.name || "Item";
    img.className = "w-full h-full object-cover rounded";

    const removeBtn = document.createElement("button");
    removeBtn.className = "absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center font-bold text-xs text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all";
    removeBtn.textContent = "×";
    removeBtn.onclick = () => removeFromCart(item.id, item.variant);

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(removeBtn);
    leftCol.appendChild(imageWrapper);

    return leftCol;
}


function buildRightColumn(product, item, qty) {
    const rightCol = document.createElement("div");
    rightCol.className = "flex-1";

    const name = document.createElement("div");
    name.className = "text-xl uppercase font-extrabold leading-tight text-black drop-shadow-lg";
    name.textContent = product?.name || item.name || "Unnamed Product";

    const bundleLabel = item.bundleLabel
        ? (() => {
            const label = document.createElement("div");
            label.className = "w-fit bg-white py-1 px-2 uppercase text-xs text-black";
            label.innerHTML = `Bundle: <span class="font-bold">${item.bundleLabel}</span>`;
            return label;
        })()
        : null;

    const variant = document.createElement("div");
    variant.className = "text-sm font-normal text-black";
    variant.textContent = item.variant || "";

    const qtyRow = document.createElement("div");
    qtyRow.className = "flex items-center justify-between mt-2";

    const qtyControl = document.createElement("div");
    qtyControl.className = "flex items-center gap-2 border-4 border-gray-300 rounded-lg";

    const minusBtn = document.createElement("button");
    minusBtn.className = "text-black bg-white font-bold text-xl px-2 rounded-l-lg hover:bg-black hover:text-white";
    minusBtn.textContent = "−";
    minusBtn.onclick = () => updateCartQty(item.id, -1);

    const qtyText = document.createElement("span");
    qtyText.className = "text-black font-medium min-w-[24px] text-center";
    qtyText.textContent = qty;

    const plusBtn = document.createElement("button");
    plusBtn.className = "text-black bg-white font-bold text-xl px-2 rounded-r-lg hover:bg-black hover:text-white";
    plusBtn.textContent = "+";
    plusBtn.onclick = () => updateCartQty(item.id, 1);

    qtyControl.appendChild(minusBtn);
    qtyControl.appendChild(qtyText);
    qtyControl.appendChild(plusBtn);

    const priceEl = document.createElement("div");
    priceEl.className = "text-right text-lg font-bold ml-3";
    const displayPrice = isNaN(item.price) ? "0.00" : item.price.toFixed(2);
    const displayOriginal = isNaN(item.originalPrice) ? null : item.originalPrice.toFixed(2);
    priceEl.innerHTML = `
        <span class="text-black">$${displayPrice}</span>
        ${displayOriginal && item.originalPrice > item.price
            ? `<span class="text-xs text-gray-200 line-through ml-1">$${displayOriginal}</span>`
            : ""}`;

    qtyRow.appendChild(qtyControl);
    qtyRow.appendChild(priceEl);

    rightCol.appendChild(name);
    if (bundleLabel) rightCol.appendChild(bundleLabel);
    rightCol.appendChild(variant);
    rightCol.appendChild(qtyRow);

    return rightCol;
}


function buildBundlePrompt(eligibleBundles) {
    const bundleWrapper = document.createElement("div");
    bundleWrapper.className = "w-full mt-2";

    const flickityContainer = document.createElement("div");
    flickityContainer.className = "bundle-carousel";
    let dragStartTime = 0;

    flickityContainer.addEventListener("pointerdown", () => {
        dragStartTime = Date.now();
    });

    for (const b of eligibleBundles) {
        const cell = document.createElement("div");
        cell.className = "carousel-cell shrink-0 mr-2";

        const btn = document.createElement("button");
        btn.className = "min-w-[100px] px-2 py-1 bg-white text-black border-4 border-gray-300 rounded-lg text-sm uppercase font-bold hover:bg-black hover:text-white hover:border-black transition shadow-sm";
        btn.textContent = b.carttxt;

        btn.addEventListener("click", (e) => {
            const dragDuration = Date.now() - dragStartTime;
            if (dragDuration > 150) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            applyBundle(b.id);
        });

        checkBundleAvailability(b.id).then(isAvailable => {
            if (!isAvailable) {
                btn.disabled = true;
                btn.classList.add("opacity-50", "cursor-not-allowed");
                btn.title = "Bundle unavailable – out of stock";
            }
        });

        cell.appendChild(btn);
        flickityContainer.appendChild(cell);
    }

    bundleWrapper.appendChild(flickityContainer);

    // Initialize Flickity
    setTimeout(() => {
        new Flickity(flickityContainer, {
            cellAlign: "left",
            contain: true,
            pageDots: false,
            prevNextButtons: false,
            draggable: true,
            freeScroll: true
        });
    }, 0);

    return bundleWrapper;
}


function updateFreeShippingBar(total) {
    const goal = 25;
    const freeShippingBar = document.getElementById("freeShippingBar");
    const freeShippingProgress = document.getElementById("freeShippingProgress");

    if (!freeShippingBar || !freeShippingProgress) {
        warnCart("Missing free shipping progress elements");
        return;
    }

    const progress = Math.min((total / goal) * 100, 100);

    if (total >= goal) {
        freeShippingBar.textContent = "🎉 You’ve unlocked FREE shipping!";
        freeShippingProgress.style.width = "100%";
        freeShippingProgress.classList.remove("bg-yellow-400");
        freeShippingProgress.classList.add("bg-green-500");
    } else {
        const diff = (goal - total).toFixed(2);
        freeShippingBar.textContent = `You're $${diff} away from free shipping!`;
        freeShippingProgress.style.width = `${progress}%`;
        freeShippingProgress.classList.remove("bg-green-500");
        freeShippingProgress.classList.add("bg-yellow-400");
    }
}
window.renderCart = renderCart;
