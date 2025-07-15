async function triggerStripeCheckout() {
  try {
    const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];
    console.log("🛒 Raw cart:", rawCart);

    const response = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: rawCart })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed to start.");
    }
  } catch (error) {
    console.error("❌ triggerStripeCheckout failed:", error);
    alert("There was a problem with checkout.");
  }
}
