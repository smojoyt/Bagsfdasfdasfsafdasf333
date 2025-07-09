// 🛠️ Fixed and enhanced uni_navbar.js

// create-checkout-session.js — no change needed for splitting bundles

// uni_navbar.js — updated logic for splitting bundles and applying promos properly

// ✅ Only run once and make sure it's globally available
if (!window.allProducts) {
    fetch('/products/products.json')
        .then(res => res.json())
        .then(data => {
            window.allProducts = data;
            console.log("🌍 window.allProducts loaded:", Object.keys(data).length);
            renderCart(); // ✅ Now safe to render
        });
}

// All other logic remains the same. Ensure renderCart() uses bundleDetector(cart) before displaying.


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
}


// Toggles the side cart drawer open or closed
window.toggleCart = function (show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    if (!cartEl || !overlay) return;

    const isVisible = cartEl.classList.contains("translate-x-0");
    const shouldShow = show !== null ? show : !isVisible;

    if (shouldShow) {
        cartEl.classList.remove("hidden", "translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");

        // Delay hiding until after transition
        setTimeout(() => {
            cartEl.classList.add("hidden");
        }, 300); // Match transition duration
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
