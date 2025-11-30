// js/checkout.js

import { getCartWithPromos } from "./Promotions/cartPromotions.js";

window.triggerStripeCheckout = async function () {
  const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];

  if (!Array.isArray(rawCart) || rawCart.length === 0) {
    alert("Your cart is empty or invalid.");
    return;
  }

  // Apply cart-level promotions before sending to backend
  let cartToSend = rawCart;
  try {
    const { cart } = await getCartWithPromos(rawCart);
    cartToSend = cart;
  } catch (err) {
    console.error("⚠️ Failed to apply cart promotions, falling back to raw cart:", err);
  }

  console.log("🛒 Sending cart to checkout:", cartToSend);

  try {
    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: cartToSend }),
    });

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed. Please try again.");
      console.error("❌ Stripe response error:", data);
    }
  } catch (err) {
    console.error("❌ Network or server error during checkout:", err);
    alert(
      "Checkout could not be completed. Please check your connection or try again later."
    );
  }
};
