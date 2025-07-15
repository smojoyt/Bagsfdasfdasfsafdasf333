import Stripe from "stripe";
import fs from "fs";
import path from "path";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid." });
    }

    const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products', 'products.json'), 'utf8'));

    const line_items = cart.map(item => {
      const product = products[item.id]; // assumes item.id matches product key

      if (!product) return null;

      const unitAmount = typeof item.price === 'number' ? item.price : product.price;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image || ""]
          },
          unit_amount: Math.round(unitAmount * 100)
        },
        quantity: item.qty || 1
      };
    }).filter(Boolean);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      success_url: "https://yourdomain.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://yourdomain.com/pages/cancel.html"
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
