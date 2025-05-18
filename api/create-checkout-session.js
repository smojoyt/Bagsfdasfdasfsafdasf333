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
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

    try {
        const { sku, selectedVariant, cart } = req.body;

        const filePath = path.join(process.cwd(), 'products', 'products.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(rawData);

        let line_items = [];

        if (Array.isArray(cart)) {
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
                            images: [image],
                            metadata: {
                                variant: variant || "N/A",
                                product_id: item.id || "N/A",
                                requires_shipping: "true",
                                clean_name: product.name
                            }
                        },
                        unit_amount: Math.round(item.price * 100)
                    },
                    quantity: item.qty || 1
                };
            }).filter(Boolean);
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

        const subtotal = line_items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);

        const shipping_options = [
            { shipping_rate: 'shr_1RO9juLzNgqX2t8KonaNgulK' }, // Standard
            { shipping_rate: 'shr_1RO9kSLzNgqX2t8K0SOnswvh' }  // Express
        ];

        if (subtotal >= 5000) {
            shipping_options.unshift({ shipping_rate: 'shr_1RO9lyLzNgqX2t8KUr7X1RJh' }); // Free shipping
        }

        const sessionOptions = {
            payment_method_types: ['card', 'link', 'klarna', 'cashapp', 'affirm', 'afterpay_clearpay'],
            mode: 'payment',
            line_items,
            customer_creation: 'always',
            billing_address_collection: 'auto',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA']
            },
            shipping_options,
            allow_promotion_codes: true,
            success_url: "https://www.karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://www.karrykraze.com/pages/cancel.html"
        };

        if (subtotal >= 6000) {
            sessionOptions.discounts = [
                { promotion_code: "promo_1RQFQVLzNgqX2t8K9or5i7Za" }
            ];
        } else {
            sessionOptions.allow_promotion_codes = true;
        }




        const session = await stripe.checkout.sessions.create(sessionOptions);


        return res.status(200).json({ url: session.url });

    } catch (err) {
        console.error("Stripe session error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
