import { initDrawers } from "./drawers.js";
import { updateCartCount, observeCart, renderCartItems } from "./cart.js";
import { setupMenuSearch } from "./search.js";
import { animateMenuLinks } from "./animations.js";
import { initSharedUI } from "../Shared/index.js";

let initialized = false;

async function loadNavbarHTML() {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  try {
    const res = await fetch("/page_inserts/navbar.html");
    navContainer.innerHTML = await res.text();
  } catch (err) {
    console.error("❌ Failed to load navbar.html:", err);
  }
}

export async function initNavbar() {
  if (initialized) return;
  initialized = true;

  try {
    console.log("⚙️ Calling initDrawers()");
    initDrawers();

    // ✅ Initialize cart state + observers
    observeCart();
    updateCartCount();
    renderCartItems();

    // ✅ Setup menu search only if the element exists
    if (document.getElementById("menu-search")) {
      setupMenuSearch();
    }


     if (document.getElementById("menu-links")) {
       animateMenuLinks();
     }

    // ✅ Dynamically load checkout logic if the checkout button exists
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      import("/js/checkout.js")
        .then(() => {
          console.log("✅ checkout.js loaded");

          checkoutBtn.addEventListener("click", async () => {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = "Redirecting...";
            await window.triggerStripeCheckout?.();
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = "Checkout";
          });
        })
        .catch((err) => {
          console.error("❌ Failed to load checkout.js:", err);
        });
    }

    // ✅ Initialize modal and shared elements
    await initSharedUI();

  } catch (err) {
    console.error("❌ Navbar initialization failed:", err);
  }
}
