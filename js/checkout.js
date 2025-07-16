window.triggerStripeCheckout = async function () {
  const cart = JSON.parse(localStorage.getItem("savedCart")) || [];

  console.log("🛒 Sending cart to checkout:", cart);

  if (!Array.isArray(cart) || cart.length === 0) {
    alert("Your cart is empty or invalid.");
    return;
  }

  try {
    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart })
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
    alert("Checkout could not be completed. Please check your connection or try again later.");
  }
};
