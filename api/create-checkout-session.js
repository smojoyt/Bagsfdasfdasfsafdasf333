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
    const { cart, email, couponCode } = req.body;
    console.log("🔥 Incoming cart:", cart);

    // 1. Validate cart structure
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

      // 2. Stock validation
      if (product.variantStock?.[item.variant] !== undefined && product.variantStock[item.variant] < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.sku} (${item.variant})` });
      }

      // 3. Field whitelisting
      const price = typeof item.price === "number" ? item.price : product.price;
      const quantity = typeof item.quantity === "number" ? item.quantity : 1;

      if (isNaN(price) || price <= 0 || quantity <= 0) {
        return res.status(400).json({ error: `Invalid price or quantity for ${item.sku}` });
      }

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image || ""],
            metadata: {
              sku: item.sku,
              variant: item.variant || "N/A"
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

    // 10. Prepare session data
    const sessionParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      customer_email: email,
      success_url: "https://karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://karrykraze.com/pages/cancel.html",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes
    };

    // 11. Apply coupon if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          sessionParams.discounts = [{ coupon: coupon.id }];
        }
      } catch (err) {
        console.warn("⚠️ Invalid coupon code: ", couponCode);
      }
    }

    // 16. Log session details before creating
    console.log("🧾 Final line_items sent to Stripe:", line_items);
    console.log("📧 Customer email:", email);
    console.log("🏷️ Coupon applied:", couponCode);

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 17. Include session ID and expiration
    const responsePayload = {
      url: session.url,
      sessionId: session.id,
      expiresAt: session.expires_at
    };

    // 18. Optional: Store cart/session in DB/log here
    // e.g., store in Firestore, Airtable, or Google Sheets
    console.log("🗃️ Session created:", responsePayload);

    return res.status(200).json(responsePayload);

  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
