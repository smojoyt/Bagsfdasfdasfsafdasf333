async function triggerStripeCheckout() {
  try {
    const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];

    if (!Array.isArray(rawCart) || rawCart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: rawCart })
    });

    if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Something went wrong with checkout.");
    }
  } catch (err) {
    console.error("❌ triggerStripeCheckout failed:", err);
    alert("Checkout failed. Please refresh and try again.");
  }
}
