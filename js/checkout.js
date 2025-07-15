document.getElementById("checkoutBtn")?.addEventListener("click", async () => {
  try {
    const savedCart = JSON.parse(localStorage.getItem("savedCart")) || [];

    const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: savedCart })
    });

    if (!res.ok) throw new Error("Failed to create Stripe session");
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Something went wrong with Stripe.");
    }
  } catch (err) {
    console.error("❌ Checkout error:", err);
    alert("Checkout failed. Please try again.");
  }
});

