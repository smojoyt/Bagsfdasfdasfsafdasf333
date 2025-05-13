function toggleCart(show = null) {
    const cartEl = document.getElementById("sideCart");
    const overlay = document.getElementById("cartOverlay");
    const isVisible = cartEl.classList.contains("translate-x-0");

    if (show === true || (!isVisible && show === null)) {
        cartEl.classList.remove("translate-x-full");
        cartEl.classList.add("translate-x-0");
        overlay.classList.remove("hidden");
    } else {
        cartEl.classList.remove("translate-x-0");
        cartEl.classList.add("translate-x-full");
        overlay.classList.add("hidden");
    }

    renderCart();
}

function renderCart() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const cartItemsEl = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    let total = 0;

    cartItemsEl.innerHTML = "";

    cart.forEach(item => {
        total += item.price * item.qty;
        cartItemsEl.innerHTML += `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-sm text-gray-500">${item.variant || ""} × ${item.qty}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium">$${(item.price * item.qty).toFixed(2)}</p>
                </div>
            </div>
        `;
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
}

// Optional: Call this on page load to update cart count
document.addEventListener("DOMContentLoaded", updateCartCount);
