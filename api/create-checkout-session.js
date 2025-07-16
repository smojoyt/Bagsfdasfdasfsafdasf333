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
      const product = products[item.sku]; // ✅ CORRECT
      if (!product) {
console.warn(`⚠️ Product not found for SKU: ${item.sku}`);
        continue;
      }

      const price = typeof item.price === "number" ? item.price : product.price;
      const quantity = item.qty || 1;

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image || ""]
          },
          unit_amount: Math.round(price * 100)
        },
        quantity
      });
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: "No valid items found in cart." });
    }

      console.log("🧾 Final line_items sent to Stripe:", line_items); // ← ADD THIS

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: "https://karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://karrykraze.com/pages/cancel.html"
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
