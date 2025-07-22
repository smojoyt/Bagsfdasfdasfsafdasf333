import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { cart } = req.body;
    console.log("🔥 Incoming cart:", cart);

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Invalid or empty cart." });
    }

    const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "products", "products.json"), "utf8"));
    const line_items = [];

    for (const item of cart) {
      const product = products[item.sku];
      if (!product) {
        console.warn(`⚠️ Product not found for SKU: ${item.sku}`);
        continue;
      }

      const variant = item.variant;
      const variantLabel = variant ? ` - ${variant}` : "";
      const quantity = item.quantity || 1;
      const price = typeof item.price === "number" ? item.price : product.price;

      let variantImage = product.image;
      if (product.variantImages && product.variantImages[variant]) {
        variantImage = product.variantImages[variant];
      }

line_items.push({
  price_data: {
    currency: "usd",
    product_data: {
      name: `${product.name}${variantLabel}`,
      images: [variantImage || product.image || ""],
      metadata: {
        product_id: item.sku  // Add SKU or ID for Make
      }
    },
    unit_amount: Math.round(price * 100)
  },
  quantity
});

    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: "No valid items found in cart." });
    }

    console.log("🧾 Final line_items sent to Stripe:", line_items);

    // 🧮 Calculate total in cents
    const cartTotalCents = line_items.reduce((sum, item) => {
      return sum + item.price_data.unit_amount * item.quantity;
    }, 0);

    // 📦 Define shipping options
    const shipping_options = [];

    if (cartTotalCents >= 2000) {
      // ✅ Free shipping for orders $20+
      shipping_options.push({
        shipping_rate_data: {
          display_name: "Free Shipping",
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 10 }
          }
        }
      });
    } else {
      // 🟠 Fallback shipping under $20
      shipping_options.push({
        shipping_rate_data: {
          display_name: "Standard Shipping",
          type: "fixed_amount",
          fixed_amount: { amount: 899, currency: "usd" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 7 }
          }
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "link", "afterpay_clearpay", "klarna"],
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      customer_creation: "always",
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      shipping_options,
      success_url: "https://karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://karrykraze.com/pages/cancel.html",


  metadata: {
    cartSummary: cart.map(item => `${item.sku}:${item.quantity}`).join(","),
    source: "karrykraze-site",
    estimatedShipping: cartTotalCents >= 2000 ? "free" : "standard",
  }
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
