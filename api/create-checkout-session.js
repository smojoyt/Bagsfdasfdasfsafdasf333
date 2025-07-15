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

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid." });
    }

    const products = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'products', 'products.json'), 'utf8')
    );

    const skuToProductKey = Object.fromEntries(
      Object.entries(products)
        .filter(([_, val]) => val.product_id)
        .map(([k, v]) => [v.product_id, k])
    );
console.log("🟡 Incoming cart:", cart);

const line_items = cart.map(item => {
  const key = skuToProductKey[item.id] || item.id;
  const product = products[key];

  if (!product) {
    console.warn(`⚠️ Product not found for ID: ${item.id}`);
    return null;
  }

  const variant = item.variant?.trim();
  const image = product.variantImages?.[variant] || product.image;
  const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";
  const unitAmount = typeof item.price === 'number' ? item.price : product.price;

  return {
    price_data: {
      currency: "usd",
      unit_amount: Math.round(unitAmount * 100),
      product_data: {
        name: product.name,
        description,
        images: [image],
        metadata: {
          variant: variant || "N/A",
          product_id: key,
          requires_shipping: "true",
          clean_name: product.name
        }
      }
    },
    quantity: item.qty || 1 // fallback
  };
}).filter(Boolean); // Remove any null entries


    if (line_items.length === 0) {
      return res.status(400).json({ error: "No valid line items." });
    }

    const subtotal = line_items.reduce((sum, i) => sum + i.price_data.unit_amount * i.quantity, 0);
    const shipping_options = [
      { shipping_rate: 'shr_1RO9juLzNgqX2t8KonaNgulK' },
      { shipping_rate: 'shr_1RO9kSLzNgqX2t8K0SOnswvh' }
    ];
    if (subtotal >= 2500) {
      shipping_options.unshift({ shipping_rate: 'shr_1RO9lyLzNgqX2t8KUr7X1RJh' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'link', 'klarna', 'cashapp', 'affirm', 'afterpay_clearpay'],
      line_items,
      customer_creation: 'always',
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      phone_number_collection: { enabled: true },
      shipping_options,
      allow_promotion_codes: true,
      success_url: "https://www.karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://www.karrykraze.com/pages/cancel.html"
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
