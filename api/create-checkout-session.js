const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');

export const config = {
    api: {
        bodyParser: true,
    },
};

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://www.karrykraze.com");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method === "POST") {
        const { sku, selectedVariant } = req.body;

        try {
            // Load products.json from the root of your project
            const filePath = path.join(process.cwd(), 'products', 'products.json');
            const rawData = fs.readFileSync(filePath, 'utf8');
            const products = JSON.parse(rawData);

            const product = products[sku];
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }

            const finalName = selectedVariant ? `${product.name} - ${selectedVariant}` : product.name;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: finalName,
                                description: product.descriptionList?.join(" | ") || product.description || "Karry Kraze item",
                                images: [product.variantImages?.[selectedVariant] || product.image],
                            },
                            unit_amount: Math.round(
                                product.tags?.includes("Onsale") && product.sale_price < product.price
                                    ? product.sale_price * 100
                                    : product.price * 100
                            ),
                        },
                        quantity: 1,
                    },
                ],
                customer_creation: "always",
                billing_address_collection: "auto",
                shipping_address_collection: {
                    allowed_countries: ["US", "CA"],
                },
                success_url: "https://www.karrykraze.com/success.html?session_id={CHECKOUT_SESSION_ID}",
                cancel_url: "https://www.karrykraze.com/cancel.html",
            });


            return res.status(200).json({ url: session.url });

        } catch (err) {
            console.error("Stripe session error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        res.setHeader("Allow", "POST");
        return res.status(405).end("Method Not Allowed");
    }
}
