import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: { bodyParser: false }, // We’ll manually parse it
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
    // 🔄 Safely parse the JSON body
    let rawBody = "";
    await new Promise((resolve, reject) => {
      req.on("data", chunk => rawBody += chunk);
      req.on("end", resolve);
      req.on("error", reject);
    });

    const body = JSON.parse(rawBody);
    const { sku, selectedVariant, cart, coupon } = body;

    const productsPath = path.join(process.cwd(), 'products', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    const skuToKey = Object.fromEntries(
      Object.entries(products).map(([k, v]) => [v.product_id, k])
    );

    let line_items = [];

    if (Array.isArray(cart)) {
      for (const item of cart) {
        const key = skuToKey[item.id] || item.id;
        const product = products[key];
        if (!product) continue;

        const variant = item.variant?.trim();
        const image = product.variantImages?.[variant] || product.image;
        const name = variant ? `${product.name} - ${variant}` : product.name;
        const price = typeof item.price === 'number' ? item.price : product.price;

        line_items.push({
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(price * 100),
            product_data: {
              name,
              images: [image],
              metadata: {
                product_id: product.product_id || key,
                variant: variant || "N/A"
              }
            }
          },
          quantity: item.qty || 1
        });
      }
    } else if (sku) {
      const product = products[sku];
      if (!product) return res.status(404).json({ error: "Product not found" });

      const variant = selectedVariant?.trim();
      const name = variant ? `${product.name} - ${variant}` : product.name;
      const image = product.variantImages?.[variant] || product.image;

      line_items = [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name,
            images: [image],
            metadata: {
              product_id: sku,
              variant: variant || "N/A"
            }
          }
        },
        quantity: 1
      }];
    } else {
      return res.status(400).json({ error: "Missing cart or sku" });
    }

    const subtotal = line_items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    const shipping_options = [
      { shipping_rate: 'shr_1RO9juLzNgqX2t8KonaNgulK' },
      { shipping_rate: 'shr_1RO9kSLzNgqX2t8K0SOnswvh' }
    ];
    if (subtotal >= 2500) {
      shipping_options.unshift({ shipping_rate: 'shr_1RO9lyLzNgqX2t8KUr7X1RJh' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'klarna', 'cashapp', 'affirm', 'afterpay_clearpay'],
      mode: 'payment',
      line_items,
      customer_creation: 'always',
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      phone_number_collection: { enabled: true },
      discounts: coupon ? [{ coupon }] : undefined,
      allow_promotion_codes: !coupon,
      shipping_options,
      success_url: `https://www.karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.karrykraze.com/pages/cancel.html`
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
