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

      const requestedQty = typeof item.quantity === "number" ? item.quantity : 1;

      if (product.variantStock?.[item.variant] !== undefined && product.variantStock[item.variant] < requestedQty) {
        return res.status(400).json({ error: `Insufficient stock for ${item.sku} (${item.variant})` });
      }

      const price = typeof item.price === "number" ? item.price : product.price;

      if (isNaN(price) || price <= 0 || requestedQty <= 0) {
        return res.status(400).json({ error: `Invalid price or quantity for ${item.sku}` });
      }

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image || "https://karrykraze.com/imgs/placeholder.jpg"],
            metadata: {
              sku: item.sku,
              variant: item.variant || "N/A"
            }
          },
          unit_amount: Math.round(price * 100)
        },
        quantity: requestedQty
      });
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: "No valid items found in cart." });
    }

    const sessionParams = {
      payment_method_types: ["card", "afterpay_clearpay", "us_bank_account"],
      mode: "payment",
      line_items,
      customer_email: email,
      success_url: "https://karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://karrykraze.com/pages/cancel.html",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["US", "CA"]
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 500,
              currency: "usd"
            },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 }
            }
          }
        }
      ],
      metadata: {
        source: "karrykraze.com",
        campaign: "main-site",
        customer_email: email
      },
      automatic_tax: { enabled: false },
      invoice_creation: { enabled: false }
    };

    if (couponCode) {
      try {
        const promoList = await stripe.promotionCodes.list({
          code: couponCode,
          active: true,
          limit: 1
        });

        const promotion = promoList.data[0];

        if (promotion && promotion.coupon && promotion.restrictions?.first_time_transaction !== true) {
          sessionParams.discounts = [{ promotion_code: promotion.id }];
        } else {
          console.warn(`⚠️ Coupon '${couponCode}' exists but is not usable (expired, limited, etc).`);
        }
      } catch (err) {
        console.warn(`⚠️ Failed to apply coupon '${couponCode}':`, err.message);
      }
    }

    console.group(`📦 Stripe Checkout Session — ${new Date().toISOString()}`);
    console.log("🧾 Line Items:");
    line_items.forEach((item, index) => {
      console.log(`  #${index + 1}`, {
        name: item.price_data.product_data.name,
        unit_amount: `$${(item.price_data.unit_amount / 100).toFixed(2)}`,
        quantity: item.quantity,
        sku: item.price_data.product_data.metadata?.sku || "N/A",
        variant: item.price_data.product_data.metadata?.variant || "N/A"
      });
    });
    console.log("📧 Customer Email:", email || "❌ Not provided");
    if (sessionParams.discounts?.length) {
      const discountType = sessionParams.discounts[0].coupon ? "Coupon" : "Promotion Code";
      console.log(`🏷️ ${discountType} Applied:`, sessionParams.discounts[0].coupon || sessionParams.discounts[0].promotion_code);
    } else {
      console.log("🏷️ Discount: ❌ None");
    }
    console.log("🌍 Redirect URLs:");
    console.log("   ✅ Success:", sessionParams.success_url);
    console.log("   ❌ Cancel :", sessionParams.cancel_url);
    console.log("⏳ Session expires in:", `${Math.floor((sessionParams.expires_at - Date.now() / 1000) / 60)} minutes`);
    console.groupEnd();

    const session = await stripe.checkout.sessions.create(sessionParams);

    const responsePayload = {
      success: true,
      message: "Stripe Checkout session created successfully.",
      timestamp: new Date().toISOString(),
      checkout: {
        url: session.url,
        sessionId: session.id,
        expiresAtEpoch: session.expires_at,
        expiresAtFormatted: new Date(session.expires_at * 1000).toISOString(),
        expiresInMinutes: Math.floor((session.expires_at - Date.now() / 1000) / 60)
      },
      summary: {
        customerEmail: email || null,
        totalItems: line_items.reduce((sum, i) => sum + i.quantity, 0),
        itemDetails: line_items.map((item) => ({
          name: item.price_data.product_data.name,
          sku: item.price_data.product_data.metadata?.sku || null,
          variant: item.price_data.product_data.metadata?.variant || null,
          quantity: item.quantity,
          unitAmount: item.price_data.unit_amount / 100,
          subtotal: (item.quantity * item.price_data.unit_amount) / 100
        })),
        discountCode: sessionParams.discounts?.[0]?.coupon || sessionParams.discounts?.[0]?.promotion_code || null
      }
    };

    console.log("🗃️ Session created:", responsePayload);

    const storeSessionData = async () => {
      try {
        const sessionLog = {
          createdAt: new Date().toISOString(),
          sessionId: session.id,
          sessionUrl: session.url,
          customerEmail: email || null,
          expiresAt: new Date(session.expires_at * 1000).toISOString(),
          totalItems: line_items.reduce((sum, i) => sum + i.quantity, 0),
          lineItems: line_items.map((item) => ({
            name: item.price_data.product_data.name,
            sku: item.price_data.product_data.metadata?.sku || null,
            variant: item.price_data.product_data.metadata?.variant || null,
            quantity: item.quantity,
            unitAmount: item.price_data.unit_amount / 100,
            subtotal: (item.quantity * item.price_data.unit_amount) / 100
          })),
          discountCode: sessionParams.discounts?.[0]?.coupon || sessionParams.discounts?.[0]?.promotion_code || null,
          origin: origin || "Unknown"
        };

        await fetch("https://hooks.make.com/your-make-url-here", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionLog)
        });

        console.log("✅ Session synced to external log.");
      } catch (err) {
        console.warn("⚠️ Failed to sync session externally:", err.message);
      }
    };

    await storeSessionData();

    return res.status(200).json(responsePayload);

  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
