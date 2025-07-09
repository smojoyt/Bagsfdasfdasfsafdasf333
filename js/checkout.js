// 🧾 Trigger Stripe Checkout
async function triggerStripeCheckout() {
    try {
        const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];
        logCart("🛒 Raw cart before bundle detection:", rawCart);

        const finalCart = await bundleDetector(rawCart);
        logCart("📦 Final cart after bundle detection:", finalCart);

        if (!Array.isArray(finalCart) || finalCart.length === 0) {
            warnCart("⚠️ Checkout aborted — cart is empty or invalid");
            alert("Your cart is empty or not valid.");
            return;
        }

        const res = await fetch("https://buy.karrykraze.com/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: finalCart })
        });

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        logCart("💳 Stripe session response:", data);

        if (data.url) {
            logCart(`✅ Redirecting to Stripe Checkout: ${data.url}`);
            window.location.href = data.url;
        } else {
            warnCart("❌ Checkout session created, but no URL returned.");
            alert("Something went wrong during checkout. Please try again.");
        }
    } catch (err) {
        errorCart("❌ triggerStripeCheckout failed:", err);
        alert("Checkout failed. Please refresh and try again.");
    }
}

window.triggerStripeCheckout = triggerStripeCheckout;
