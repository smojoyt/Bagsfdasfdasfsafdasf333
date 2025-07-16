window.triggerStripeCheckout = async function () {
  const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];

  // optional console log
  console.log("🛒 Sending cart to checkout:", rawCart);

  const finalCart = await bundleDetector(rawCart); // if you have this
  if (!Array.isArray(finalCart) || finalCart.length === 0) {
    alert("Your cart is empty or invalid.");
    return;
  }

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
    console.error("❌ Stripe error:", data);
  }
};
