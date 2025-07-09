async function triggerStripeCheckout() {
    const rawCart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const finalCart = await bundleDetector(rawCart);


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
    }
}

window.triggerStripeCheckout = triggerStripeCheckout;
