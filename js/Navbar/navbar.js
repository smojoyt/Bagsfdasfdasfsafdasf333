// ✅ navbar.js
import { initNavbar } from "./index.js";
import { updateCartCount, observeCart } from "./cart.js"; // add this import

document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  try {
    const res = await fetch("/page_inserts/navbar.html");
    if (!res.ok) throw new Error("Failed to fetch navbar");

    navContainer.innerHTML = await res.text();

    // 🛠 Ensures new DOM is fully parsed before attaching listeners
    requestAnimationFrame(() => {
      setTimeout(() => {
        initNavbar();        // ✅ initDrawers will now bind correctly
        updateCartCount();
        observeCart();
      }, 0);
    });

  } catch (err) {
    navContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 text-center">Navbar failed to load.</div>`;
    console.error("❌ Navbar load failed:", err);
  }
});


