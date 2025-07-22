///js/Navbar/cart.js

const checkoutBtn = document.getElementById("checkoutBtn");

checkoutBtn?.addEventListener("click", async () => {
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Redirecting...";
  await triggerStripeCheckout();
  checkoutBtn.disabled = false;
  checkoutBtn.textContent = "Checkout";
});


// === Utility Functions ===
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem("savedCart")) || [];
  } catch {
    return [];
  }
}

function animateFadeOut(el, callback) {
  el.style.willChange = "opacity, transform"; // Hint to browser
  el.getBoundingClientRect(); // 🧠 Force reflow
  el.classList.add("transition", "duration-300", "opacity-0", "-translate-y-2");

  setTimeout(() => {
    callback?.();
  }, 300);
}


function animateQuantityChange(el) {
  el.classList.add("scale-110");
  setTimeout(() => el.classList.remove("scale-110"), 200);
}

// === Public Functions ===

export function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  el.textContent = total || "0";
}


export function observeCart() {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === "savedCart") {
      updateCartCount();
      renderCartItems();
    }
  };

  window.addEventListener("storage", (e) => {
    if (e.key === "savedCart") {
      updateCartCount();
      renderCartItems();
    }
  });
}

export function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  const emptyMsg = document.getElementById("cart-empty");
  const subtotalEl = document.getElementById("cart-subtotal");
  const footer = document.getElementById("cart-footer");

  if (!container || !emptyMsg || !subtotalEl || !footer) return;

  const cart = getCart();
  container.innerHTML = "";

  if (cart.length === 0) {
    emptyMsg.classList.remove("hidden");
    footer.classList.add("hidden");
    subtotalEl.textContent = "$0.00";
    return;
  }

  emptyMsg.classList.add("hidden");
  footer.classList.remove("hidden");

  let subtotal = 0;
  const frag = document.createDocumentFragment();

  cart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const total = qty * price;
    subtotal += total;

    const variant = item.variant
      ? `<div class="text-xs text-gray-500 italic">Variant: ${item.variant}</div>`
      : "";

    const div = document.createElement("div");
    div.className = "border-b pb-4 flex items-start gap-4 relative";
    div.innerHTML = `
      <div class="relative w-20 h-20 shrink-0">
        <img src="${item.image || "/imgs/placeholder.jpg"}"
             alt="${item.name || "Item"}"
             class="w-full h-full object-cover rounded" />
        <button class="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow remove-item"
                data-index="${index}">
          ×
        </button>
      </div>
      <div class="flex-grow">
        <div class="font-semibold">${item.name || "Unnamed Item"}</div>
        ${variant}

        <div class="mt-3 flex items-center justify-between w-full">
          <div class="flex items-center gap-2 text-sm border rounded overflow-hidden">
            <button class="qty-btn px-3 py-1 bg-gray-100 hover:bg-gray-200" data-action="decrease" data-index="${index}">−</button>
            <span class="font-medium quantity-count px-2">${qty}</span>
            <button class="qty-btn px-3 py-1 bg-gray-100 hover:bg-gray-200" data-action="increase" data-index="${index}">+</button>
          </div>
          <div class="text-base font-bold text-right ml-4 whitespace-nowrap">
  ${
    item.originalPrice && item.originalPrice > item.price
      ? `<span class="text-red-600">$${item.price.toFixed(2)}</span>
         <span class="line-through text-gray-400 text-xs ml-1">$${item.originalPrice.toFixed(2)}</span>`
      : `$${item.price.toFixed(2)}`
  }
</div>

        </div>
      </div>
    `;

    frag.appendChild(div);
  });

  container.appendChild(frag);
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  setupCartInteractionHandlers();
}


// === Interaction Logic ===
function setupCartInteractionHandlers() {
  const container = document.getElementById("cart-items-container");

  container.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      const action = btn.dataset.action;
      const cart = getCart();

      if (!cart[index]) return;

      if (action === "increase") {
        cart[index].quantity = (cart[index].quantity || 1) + 1;
      } else if (action === "decrease") {
        if ((cart[index].quantity || 1) <= 1) {
          // Remove item if quantity goes below 1
          const el = btn.closest(".border-b");
          animateFadeOut(el, () => {
            cart.splice(index, 1);
            saveCart(cart);
          });
          return;
        } else {
          cart[index].quantity -= 1;
        }
      }

      saveCart(cart);
    });
  });

  container.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      const cart = getCart();
      const el = btn.closest(".border-b");
      animateFadeOut(el, () => {
        cart.splice(index, 1);
        saveCart(cart);
      });
    });
  });

  container.querySelectorAll(".quantity-count").forEach((el) => {
    animateQuantityChange(el);
  });
}

export function saveCart(cart) {
  localStorage.setItem("savedCart", JSON.stringify(cart));
  updateCartCount();

  // ✅ Force immediate UI re-render on mobile
  requestAnimationFrame(() => {
    renderCartItems();
  });
}

