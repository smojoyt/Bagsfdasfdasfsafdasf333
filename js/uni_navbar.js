// ✅ REBUILT uni_navbar.js — syncs with updated create-checkout-session.js logic

async function triggerStripeCheckout() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Checkout failed.");
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
}

function saveCart(cart) {
    localStorage.setItem("savedCart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function adjustQuantity(index, action) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    if (action === "increase") cart[index].qty++;
    else if (--cart[index].qty <= 0) cart.splice(index, 1);
    saveCart(cart);
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    cart.splice(index, 1);
    saveCart(cart);
}

function toggleCart(show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    const isVisible = cartEl.classList.contains("translate-x-0");
    if (show === true || (!isVisible && show === null)) {
        cartEl.classList.remove("translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.add("translate-x-full");
        cartEl.classList.remove("translate-x-0");
        overlay.classList.add("hidden");
    }
    renderCart();
}

async function applyPromotionsAndBundles(cart) {
    const [productRes, promoRes, bundleRes] = await Promise.all([
        fetch("/products/products.json"),
        fetch("/products/promotion.json"),
        fetch("/products/bundles.json")
    ]);

    const products = await productRes.json();
    const { promotions } = await promoRes.json();
    const bundles = await bundleRes.json();

    const flat = cart.flatMap(i => Array.from({ length: i.qty || 1 }, () => ({ ...i, _used: false })));

    // 🔥 Apply promotions
    const now = new Date();
    for (const promo of promotions) {
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        if (now < start || now > end) continue;

        for (const item of flat) {
            const prod = products[item.id];
            if (!prod || item._used) continue;
            if (prod.category !== promo.category) continue;

            if (promo.type === "percent") {
                const meetsMin = !promo.condition?.minPrice || item.price >= promo.condition.minPrice;
                const meetsMax = !promo.condition?.maxPrice || item.price <= promo.condition.maxPrice;
                if (meetsMin && meetsMax) {
                    const discount = item.price * (promo.amount / 100);
                    item.price = parseFloat((item.price - discount).toFixed(2));
                    item.promoLabel = promo.name;
                }
            } else if (promo.type === "fixed") {
                const meetsMax = !promo.condition?.maxPrice || item.price <= promo.condition.maxPrice;
                if (meetsMax && item.price > promo.amount) {
                    item.price = parseFloat((item.price - promo.amount).toFixed(2));
                    item.promoLabel = promo.name;
                }
            }
        }
    }

    // 📦 Apply bundles
    for (const bundle of bundles) {
        for (let u = 0; u < (bundle.maxUses || 1); u++) {
            const match = bundle.requiredCategories
                ? bundle.requiredCategories.map(cat => flat.find(i => !i._used && products[i.id]?.category === cat && !(bundle.excludeSkus || []).includes(i.id)))
                : flat.filter(i => !i._used && products[i.id]?.category === bundle.category && (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))).slice(0, bundle.minQuantity);

            if (match.includes(undefined)) continue;

            const priceEach = bundle.bundlePriceTotal / match.length;
            for (const item of match) {
                if (item.price > priceEach) item.price = parseFloat(priceEach.toFixed(2));
                item.bundleLabel = bundle.name;
                item._used = true;
            }
        }
    }

    // 🧩 Re-group
    const grouped = {};
    for (const item of flat) {
        const key = `${item.id}_${item.variant || ""}_${item.bundleLabel || ""}`;
        grouped[key] = grouped[key] ? { ...grouped[key], qty: grouped[key].qty + 1 } : { ...item, qty: 1 };
    }
    return Object.values(grouped);
}

async function renderCart() {
    let cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    cart = await applyPromotionsAndBundles(cart);
    localStorage.setItem("savedCart", JSON.stringify(cart));

    const cartItemsEl = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const emptyMsg = document.getElementById("emptyCartMessage");
    const bar = document.getElementById("freeShippingBar");
    const barFill = document.getElementById("freeShippingProgress");

    if (!cartItemsEl || !cartTotalEl) return;
    cartItemsEl.innerHTML = "";

    if (cart.length === 0) {
        emptyMsg?.classList.remove("hidden");
        checkoutBtn?.classList.add("hidden");
        cartTotalEl.parentElement?.classList.add("hidden");
        bar?.classList.add("hidden");
        return;
    }

    emptyMsg?.classList.add("hidden");
    checkoutBtn?.classList.remove("hidden");
    cartTotalEl.parentElement?.classList.remove("hidden");
    bar?.classList.remove("hidden");

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        cartItemsEl.innerHTML += `
        <div class="flex gap-4 items-start justify-between">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded border" />
            <div class="flex-1">
                <p class="font-semibold text-sm">${item.name}</p>
                ${item.bundleLabel ? `<p class="text-xs text-purple-600 font-semibold mt-1">📦 ${item.bundleLabel}</p>` : ""}
                <p class="text-xs text-gray-500">${item.variant || ""}</p>
                <div class="flex items-center gap-2 mt-1">
                    <button class="text-xs px-2 py-1 border rounded qty-btn" data-action="decrease" data-index="${index}">−</button>
                    <span class="text-sm">${item.qty}</span>
                    <button class="text-xs px-2 py-1 border rounded qty-btn" data-action="increase" data-index="${index}">+</button>
                    <button class="text-red-500 text-xs hover:underline ml-4 remove-btn" data-index="${index}">Remove</button>
                </div>
            </div>
            <div class="text-right font-medium text-sm">$${(item.price * item.qty).toFixed(2)}</div>
        </div>`;
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
    const goal = 25;
    const progress = Math.min((total / goal) * 100, 100);
    if (total >= goal) {
        bar.textContent = "🎉 You’ve unlocked FREE shipping!";
        barFill.style.width = "100%";
        barFill.classList.add("bg-green-500");
        barFill.classList.remove("bg-yellow-400");
    } else {
        bar.textContent = `You're $${(goal - total).toFixed(2)} away from free shipping!`;
        barFill.style.width = `${progress}%`;
        barFill.classList.remove("bg-green-500");
        barFill.classList.add("bg-yellow-400");
    }

    document.querySelectorAll(".qty-btn").forEach(btn => {
        btn.onclick = () => adjustQuantity(parseInt(btn.dataset.index), btn.dataset.action);
    });

    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.onclick = () => removeFromCart(parseInt(btn.dataset.index));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderCart();
    const btn = document.getElementById("checkoutBtn");
    if (btn) btn.onclick = triggerStripeCheckout;

    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    cartEl?.classList.add("translate-x-full", "no-transition");
    overlay?.classList.add("hidden");
    requestAnimationFrame(() => cartEl?.classList.remove("no-transition"));
});
