// 🛠️ Fixed and enhanced uni_navbar.js

// create-checkout-session.js — no change needed for splitting bundles

// uni_navbar.js — updated logic for splitting bundles and applying promos properly

async function triggerStripeCheckout() {
    const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const finalCart = await bundleDetector(rawCart);


    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: finalCart })
    });


    const data = await res.json();
    if (data.url) {
        window.location.href = data.url;
    } else {
        alert("Checkout failed.");
    }
}

function saveCart(cart) {
    localStorage.setItem("savedCart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
}




async function bundleDetector(cart) {
    try {
        const [bundleRes, productRes, promoRes] = await Promise.all([
            fetch("/products/bundles.json"),
            fetch("/products/products.json"),
            fetch("/products/promotion.json")
        ]);

        const bundles = await bundleRes.json();
        const products = await productRes.json();
        const { promotions } = await promoRes.json();
        const now = new Date();

        const idToCategory = {};
        const idToSubCategory = {}; // ✅ new
        const idToPrice = {};
        const idToKey = {};

        for (const key in products) {
            const prod = products[key];
            if (prod.product_id) {
                idToCategory[prod.product_id] = prod.category || "";
                idToSubCategory[prod.product_id] = prod.subCategory || ""; // ✅ grab subCategory
                idToPrice[prod.product_id] = prod.price;
                idToKey[prod.product_id] = key;
            }
        }

        const flatCart = [];
        for (const item of cart) {
            const qty = item.qty || 1;
            const category = idToCategory[item.id] || "";
            const subCategory = idToSubCategory[item.id] || ""; // ✅ assign subCategory
            const productKey = idToKey[item.id] || "";
            const basePrice = idToPrice[item.id];
            for (let i = 0; i < qty; i++) {
                flatCart.push({
                    ...item,
                    qty: 1,
                    _used: false,
                    category,
                    subCategory, // ✅ now in cart item
                    productKey,
                    price: basePrice
                });
            }
        }

        // --- APPLY BUNDLES ---
        for (const bundle of bundles) {
            const maxUses = bundle.maxUses || 1;

            for (let useCount = 0; useCount < maxUses; useCount++) {
                let match = [];

                if (bundle.subCategory && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        i.subCategory === bundle.subCategory &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);
                } else if (bundle.category && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        i.category === bundle.category &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);
                } else if (bundle.specificSkus && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        bundle.specificSkus.includes(i.productKey) &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);
                } else if (bundle.requiredCategories) {
                    match = bundle.requiredCategories.map(cat =>
                        flatCart.find(i =>
                            !i._used &&
                            i.category === cat &&
                            !(bundle.excludeSkus || []).includes(i.id)
                        )
                    );
                    if (match.includes(undefined)) match = [];
                }

                if (match.length === (bundle.minQuantity || match.length) && !match.includes(undefined)) {
                    const unitPrice = bundle.bundlePriceTotal / match.length;
                    match.forEach(i => {
                        i.price = parseFloat(unitPrice.toFixed(2));
                        i.bundleLabel = bundle.name;
                        i._used = true;
                    });
                }
            }
        }

        // --- APPLY PROMOTIONS (not used in bundles) ---
        for (const promo of promotions) {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = !promo.startDate || (!isNaN(start) && !isNaN(end) && now >= start && now <= end);

            if (isActive && promo.type === "percent") {
                flatCart.forEach(i => {
                    if (
                        !i._used &&
                        i.category === promo.category &&
                        (!promo.condition?.minPrice || i.price >= promo.condition.minPrice)
                    ) {
                        const discount = i.price * (promo.amount / 100);
                        i.price = parseFloat((i.price - discount).toFixed(2));
                        i.promoLabel = promo.name;
                    }
                });
            }
        }

        // --- CLEAN LABELS BEFORE GROUPING ---
        flatCart.forEach(i => {
            if (!i._used) {
                i.bundleLabel = "";
                i.promoLabel = "";
            }
        });

        // --- GROUP BY FINAL PRICE + LABELS ---
        const grouped = {};
        flatCart.forEach(item => {
            const key = `${item.id}_${item.variant || ""}_${item.price}_${item.bundleLabel || ""}_${item.promoLabel || ""}`;
            if (!grouped[key]) grouped[key] = { ...item, qty: 1 };
            else grouped[key].qty++;
        });

        return Object.values(grouped);
    } catch (e) {
        console.error("bundleDetector failed:", e);
        return cart;
    }
}



// All other logic remains the same. Ensure renderCart() uses bundleDetector(cart) before displaying.


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
}

function adjustQuantity(index, action) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    if (action === "increase") {
        cart[index].qty += 1;
    } else if (action === "decrease") {
        cart[index].qty -= 1;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
    }
    saveCart(cart);
    renderCart(); // 👈 add this to reflect changes instantly
}


function removeFromCart(id) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }
}

function updateCartQty(id, change) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        const action = change > 0 ? "increase" : "decrease";
        adjustQuantity(index, action);
        renderCart();
    }
}




function loadBundlesAndRenderCart() {
    fetch('https://karrykraze.com/products/bundles.json')
        .then(res => {
            if (!res.ok) {
                console.error(`❌ HTTP error loading bundles.json: ${res.status}`);
                throw new Error("Network response was not ok");
            }
            return res.json();
        })
        .then(data => {
            console.log("✅ Loaded bundles:", data);
            window.bundlesData = data;
            renderCart();
        })
        .catch(err => {
            console.error("❌ Failed to load bundles.json", err);
            renderCart(); // still show cart
        });
}





function renderCart() {
    let cart = JSON.parse(localStorage.getItem("savedCart")) || [];

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

        if (!cartItemsContainer || !cartTotalEl) return;

        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            emptyMsg?.classList.remove("hidden");
            cartTotalEl.parentElement?.classList.add("hidden");
            freeShippingBar?.classList.add("hidden");
            freeShippingProgress?.parentElement?.classList.add("hidden");
            checkoutBtn?.classList.add("hidden");
            return;
        }

        emptyMsg?.classList.add("hidden");
        cartTotalEl.parentElement?.classList.remove("hidden");
        freeShippingBar?.classList.remove("hidden");
        freeShippingProgress?.parentElement?.classList.remove("hidden");
        checkoutBtn?.classList.remove("hidden");

        let total = 0;

        cart.forEach(item => {
            if (!item.originalPrice) item.originalPrice = item.price;
            total += item.price * item.qty;

            const eligibleBundles = item.bundleLabel ? [] : getAvailableBundlesForItem(item, cart);

            const bundleTxt = eligibleBundles.map(b => {
                return `<div class="bg-white mt-1 p-1 px-2 border-2 border-black text-black uppercase text-[11px] font-bold rounded w-fit">${b.carttxt}</div>`;
            }).join("");

            const itemHTML = `
<!-- 🛍️ Start of cart item block -->
<div class="flex items-start gap-3 border-b-4 border-gray-300 pb-4 last:border-none group">

  <!-- 🖼️ Image and Remove Button -->
<div class="relative aspect-square h-full min-w-[6rem] max-w-[6rem]">
  <img src="${item.image}" alt="${item.name}" 
       class="w-full h-full object-cover rounded" />

  <!-- ❌ Remove button -->
  <button onclick="removeFromCart('${item.id}')"
    class="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center font-bold text-s text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all">
    ×
  </button>
</div>


  <!-- 📦 Item Details -->
  <div class="flex-1">
    
    <!-- 🏷️ Product Name -->
    <div class="text-xl uppercase font-extrabold leading-tight text-black drop-shadow-lg">
      ${item.name}
    </div>
    
    <!-- 🎁 Bundle Label (if applicable) -->
    ${item.bundleLabel ? `<div class="uppercase text-xs text-black">Bundle: <span class="font-bold">${item.bundleLabel}</span></div>` : ""}
    
    <!-- 🎨 Variant (if any) -->
    <div class="text-sm font-normal text-black">${item.variant || ""}</div>

    <!-- 🔢 Quantity Selector and 💲 Price Row -->
    <div class="flex items-center justify-between mt-2">
      
      <!-- ➕➖ Quantity Controls -->
      <div class="flex items-center gap-2 border-4 border-gray-300 rounded-lg px-2 py-1">
        <button onclick="updateCartQty('${item.id}', -1)" class="text-black font-bold text-xl px-2">−</button>
        <span class="text-black font-medium min-w-[24px] text-center">${item.qty}</span>
        <button onclick="updateCartQty('${item.id}', 1)" class="text-black font-bold text-xl px-2">+</button>
      </div>

      <!-- 💰 Item Price and Original Price (if discounted) -->
      <div class="text-right text-lg font-bold ml-3">
        <span class="text-black">$${(item.price).toFixed(2)}</span>
        ${item.originalPrice > item.price ? `<span class="text-xs text-gray-200 line-through ml-1">$${(item.originalPrice).toFixed(2)}</span>` : ""}
      </div>
    </div>

    <!-- 💬 Optional Bundle Promo Text (carttxt) under quantity -->
    <div class="mt-2">
      ${bundleTxt}
    </div>

  </div>
</div>
<!-- 🛍️ End of cart item block -->
`;




            cartItemsContainer.insertAdjacentHTML("beforeend", itemHTML);
        });

        cartTotalEl.textContent = `$${total.toFixed(2)}`;

        const goal = 25;
        const progress = Math.min((total / goal) * 100, 100);
        if (freeShippingBar && freeShippingProgress) {
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
    });
}

function getAvailableBundlesForItem(item, cart) {
    const bundles = window.bundlesData || [];
    const applicableBundles = [];

    const itemId = item.id?.toLowerCase();
    const itemSub = item.subCategory?.toLowerCase();

    for (const bundle of bundles) {
        if (!bundle.carttxt) continue;

        let matches = false;

        const skus = bundle.specificSkus?.map(s => s.toLowerCase()) || [];
        const bundleSub = bundle.subCategory?.toLowerCase();

        if (skus.includes(itemId)) matches = true;
        if (bundleSub && bundleSub === itemSub) matches = true;

        if (!matches) continue;

        const matchCount = cart.filter(ci => {
            const ciId = ci.id?.toLowerCase();
            const ciSub = ci.subCategory?.toLowerCase();
            return skus.includes(ciId) || (bundleSub && ciSub === bundleSub);
        }).reduce((sum, ci) => sum + ci.qty, 0);

        const maxAllowed = bundle.maxUses * bundle.minQuantity;

        if (matchCount <= maxAllowed) {
            applicableBundles.push(bundle);
        }
    }
    return applicableBundles;
}




// Toggles the side cart drawer open or closed
window.toggleCart = function (show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    if (!cartEl || !overlay) return;

    const isVisible = cartEl.classList.contains("translate-x-0");

    if (show === true || (show === null && !isVisible)) {
        cartEl.classList.remove("translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");
    }

    renderCart?.(); // optional: refresh cart when opening
};


document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    const tryBindCheckout = () => {
        const btn = document.getElementById("checkoutBtn");
        if (btn) {
            btn.addEventListener("click", triggerStripeCheckout);
        } else {
            setTimeout(tryBindCheckout, 100);
        }
    };

    tryBindCheckout();

    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");

    cartEl?.classList.add("translate-x-full", "no-transition");
    overlay?.classList.add("hidden");

    requestAnimationFrame(() => {
        cartEl?.classList.remove("no-transition");
    });

    loadBundlesAndRenderCart();
});
