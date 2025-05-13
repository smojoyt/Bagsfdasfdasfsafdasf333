const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');

export const config = {
    api: { bodyParser: true }
};

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://www.karrykraze.com");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).end("Method Not Allowed");
    }

    try {
        const { sku, selectedVariant, cart } = req.body;

        // Load full product data
        const filePath = path.join(process.cwd(), 'products', 'products.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(rawData);

        let line_items = [];

        if (Array.isArray(cart)) {
            // 🛒 MULTI-ITEM: From custom side cart
            line_items = cart.map(item => {
                const product = Object.values(products).find(p => p.product_id === item.id);
                if (!product) return null;

                const variant = item.variant?.trim();
                const image = product.variantImages?.[variant] || product.image;
                const name = variant ? `${product.name} - ${variant}` : product.name;
                const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";

                return {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name,
                            description,
                            images: [image]
                        },
                        unit_amount: Math.round(item.price * 100)
                    },
                    quantity: item.qty || 1
                };
            }).filter(Boolean);
        } else if (sku) {
            // 🛍️ SINGLE ITEM: Fallback (like direct buy now button)
            const product = products[sku];
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }

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
                        images: [image]
                    },
                    unit_amount: Math.round(
                        product.tags?.includes("Onsale") && product.sale_price < product.price
                            ? product.sale_price * 100
                            : product.price * 100
                    )
                },
                quantity: 1
            }];
        } else {
            return res.status(400).json({ error: "No valid cart or SKU provided." });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items,
            customer_creation: "always",
            billing_address_collection: "auto",
            shipping_address_collection: {
                allowed_countries: ["US", "CA"]
            },
            allow_promotion_codes: true,
            success_url: "https://www.karrykraze.com/success.html?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://www.karrykraze.com/cancel.html"
        });

        return res.status(200).json({ url: session.url });

    } catch (err) {
        console.error("Stripe session error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
