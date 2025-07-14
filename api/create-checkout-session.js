import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';
import { bundleDetector } from "./CartUtilsServer.js";

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

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { sku, selectedVariant, cart, coupon } = req.body;

    const productsPath = path.join(process.cwd(), 'products', 'products.json');
    const promosPath = path.join(process.cwd(), 'products', 'promotion.json');
    const bundlesPath = path.join(process.cwd(), 'products', 'bundles.json');

    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const promotionsData = fs.existsSync(promosPath)
      ? JSON.parse(fs.readFileSync(promosPath, 'utf8'))
      : { promotions: [] };
    const bundles = fs.existsSync(bundlesPath)
      ? JSON.parse(fs.readFileSync(bundlesPath, 'utf8'))
      : [];

    const { promotions } = promotionsData;
    const skuToProductKey = Object.fromEntries(
      Object.entries(products)
        .filter(([_, val]) => val.product_id)
        .map(([k, v]) => [v.product_id, k])
    );

    let line_items = [];

    if (Array.isArray(cart)) {
      const finalCart = await bundleDetector(cart);

      for (const item of finalCart) {
        const product = products[skuToProductKey[item.id] || item.id];
        if (!product) continue;

        const variant = item.variant?.trim();
        const image = product.variantImages?.[variant] || product.image;
        const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";
        const unitAmount = typeof item.price === 'number' ? item.price : product.price;

        line_items.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.bundleLabel
                ? `${item.name || product.name} (${item.bundleLabel})`
                : item.name || product.name,
              description,
              images: [image],
              metadata: {
                variant: variant || "N/A",
                product_id: skuToProductKey[item.id] || item.id,
                requires_shipping: "true",
                clean_name: product.name,
                ...(item.bundleLabel && { bundle_applied: item.bundleLabel }),
                ...(item.promoLabel && { promotion_applied: item.promoLabel })
              }
            },
            unit_amount: Math.round(Math.max(0, unitAmount) * 100)
          },
          quantity: item.qty || 1
        });
      }

    } else if (sku) {
      const product = products[sku];
      if (!product) return res.status(404).json({ error: "Product not found" });

      const variant = selectedVariant?.trim();
      const image = product.variantImages?.[variant] || product.image;
      const name = variant ? `${product.name} - ${variant}` : product.name;
      const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";

      line_items = [{
        price_data: {
          currency: "usd",
          product_data: {
            name,
            description,
            images: [image],
            metadata: {
              variant: variant || "N/A",
              product_id: sku,
              requires_shipping: "true",
              clean_name: product.name
            }
          },
          unit_amount: Math.round(product.price * 100)
        },
        quantity: 1
      }];
    } else {
      return res.status(400).json({ error: "No valid cart or SKU provided." });
    }

    if (!Array.isArray(line_items) || line_items.length === 0) {
      console.error("❌ No valid line_items generated:", line_items);
      return res.status(400).json({ error: "Your cart is empty or invalid." });
    }

    const subtotal = line_items.reduce((sum, i) => sum + i.price_data.unit_amount * i.quantity, 0);
    const shipping_options = [
      { shipping_rate: 'shr_1RO9juLzNgqX2t8KonaNgulK' },
      { shipping_rate: 'shr_1RO9kSLzNgqX2t8K0SOnswvh' }
    ];
    if (subtotal >= 2500) shipping_options.unshift({ shipping_rate: 'shr_1RO9lyLzNgqX2t8KUr7X1RJh' });

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
      success_url: "https://www.karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://www.karrykraze.com/pages/cancel.html"
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
