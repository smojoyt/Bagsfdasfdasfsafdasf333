// ✅ Full Navbar Loader and Logic - Optimized Version

document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  try {
    const res = await fetch("/page_inserts/navbar.html");
    if (!res.ok) throw new Error("Failed to fetch navbar");
    navContainer.innerHTML = await res.text();
    requestAnimationFrame(() => Navbar.init());
  } catch (err) {
    navContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 text-center">Navbar failed to load.</div>`;
    console.error("❌ Navbar load failed:", err);
  }
});

const Navbar = {
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this.initDrawers();
    this.observeCart();
    this.updateCartCount();
    this.renderCartItems();
    this.setupMenuSearch();
    this.animateMenuLinks();
  },

  initDrawers() {
    const overlay = document.getElementById("drawer-overlay");
    const menuDrawer = document.getElementById("menu-drawer");
    const cartDrawer = document.getElementById("cart-drawer");
    const openMenuBtn = document.getElementById("menu-toggle");
    const openCartBtn = document.getElementById("cart-toggle");
    const closeBtns = document.querySelectorAll(".drawer-close");

    const openDrawer = (type) => {
      const isMenu = type === "menu";
      menuDrawer.classList.toggle("-translate-x-full", !isMenu);
      cartDrawer.classList.toggle("translate-x-full", isMenu);
      overlay.classList.remove("opacity-0", "pointer-events-none");
      document.body.classList.add("overflow-hidden");

      if (!isMenu) this.renderCartItems();
    };

    const closeAll = () => {
      menuDrawer.classList.add("-translate-x-full");
      cartDrawer.classList.add("translate-x-full");
      overlay.classList.add("opacity-0", "pointer-events-none");
      document.body.classList.remove("overflow-hidden");
    };

    openMenuBtn?.addEventListener("click", () => openDrawer("menu"));
    openCartBtn?.addEventListener("click", () => openDrawer("cart"));
    overlay?.addEventListener("click", closeAll);
    for (const btn of closeBtns) btn.addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

    // Touch swipe to close (drawer only)
    let startX = 0;
    [menuDrawer, cartDrawer].forEach(drawer => {
      drawer.addEventListener("touchstart", (e) => startX = e.touches[0].clientX);
      drawer.addEventListener("touchend", (e) => {
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 100) closeAll();
      });
    });
  },

  updateCartCount() {
    const el = document.getElementById("cart-count");
    try {
      const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
      const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      if (el) el.textContent = total;
    } catch {
      if (el) el.textContent = "0";
    }
  },

  observeCart() {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === "savedCart") {
        Navbar.updateCartCount();
        Navbar.renderCartItems();
      }
    };

    // Cross-tab sync
    window.addEventListener("storage", (e) => {
      if (e.key === "savedCart") {
        Navbar.updateCartCount();
        Navbar.renderCartItems();
      }
    });
  },

renderCartItems() {
  const container = document.getElementById("cart-items-container");
  const emptyMsg = document.getElementById("cart-empty");
  const subtotalEl = document.getElementById("cart-subtotal");
  const footer = document.getElementById("cart-footer"); // 👈 NEW: footer section (subtotal + checkout)

  if (!container || !emptyMsg || !subtotalEl || !footer) return;

  const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
  container.innerHTML = "";

  if (cart.length === 0) {
    emptyMsg.classList.remove("hidden");      // Show "Your cart is empty"
    footer.classList.add("hidden");           // Hide footer section
    subtotalEl.textContent = "$0.00";
    return;
  }

  emptyMsg.classList.add("hidden");           // Hide empty message
  footer.classList.remove("hidden");          // Show subtotal + checkout

  let subtotal = 0;
  const frag = document.createDocumentFragment();

  cart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const total = qty * price;
    subtotal += total;

    const div = document.createElement("div");
    div.className = "border-b pb-4 flex items-start gap-4 relative";
    div.innerHTML = `
      <div class="relative">
        <button class="absolute -left-5 top-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold remove-item" data-index="${index}">×</button>
      </div>
      <img src="${item.image || "/imgs/placeholder.jpg"}" alt="${item.name || "Item"}" class="w-16 h-16 object-cover border rounded" />
      <div class="flex-grow">
        <div class="font-semibold">${item.name || "Unnamed Item"}</div>
        <div class="text-xs text-gray-600">Qty: ${qty}</div>
        <div class="text-sm font-bold">$${price.toFixed(2)} each</div>
        <div class="text-xs text-gray-800">Total: $${total.toFixed(2)}</div>
      </div>
    `;
    frag.appendChild(div);
  });

  container.appendChild(frag);
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  container.querySelectorAll(".remove-item").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.getAttribute("data-index"));
      let updatedCart = JSON.parse(localStorage.getItem("savedCart")) || [];
      updatedCart.splice(index, 1);
      localStorage.setItem("savedCart", JSON.stringify(updatedCart));
    })
  );
},


  setupMenuSearch() {
    const input = document.getElementById("menu-search");
    const list = document.getElementById("menu-links");
    if (!input || !list) return;

    const items = Array.from(list.querySelectorAll("li"));

    const highlight = (text, query) =>
      text.replace(new RegExp(`(${query})`, "gi"), `<mark class="bg-yellow-200 font-bold">$1</mark>`);

    const filterLinks = (query) => {
      const term = query.trim().toLowerCase();
      for (const li of items) {
        const link = li.querySelector("a");
        const text = link.textContent;
        if (!term || text.toLowerCase().includes(term)) {
          li.style.display = "";
          link.innerHTML = highlight(text, term);
        } else {
          li.style.display = "none";
        }
      }
    };

    let debounceTimer;
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => filterLinks(input.value), 300);
    });
  },

  animateMenuLinks() {
    const links = document.querySelectorAll("#menu-links li");
    links.forEach((li, i) => {
      li.classList.add("opacity-0", "translate-x-2");
      setTimeout(() => {
        li.classList.remove("opacity-0", "translate-x-2");
        li.classList.add("transition", "duration-500", "ease-out");
      }, 100 * i);
    });
  }
};
