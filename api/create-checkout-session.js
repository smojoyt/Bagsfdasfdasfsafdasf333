import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const config = {
    api: { bodyParser: true }
};

export default async function handler(req, res) {
    const allowedOrigins = [
        "https://karrykraze.com",
        "https://www.karrykraze.com"
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.status(200).end(); // Handle preflight
    }

    if (req.method !== "POST") {
        return res.status(405).end("Method Not Allowed");
    }

    try {
        console.log("Incoming body:", req.body);
        const { sku, selectedVariant, cart, coupon } = req.body;

        const filePath = path.join(process.cwd(), 'products', 'products.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(rawData);

        // 🔁 Build reverse lookup: { checkout_product_id: productKey }
        const checkoutToProductKey = Object.entries(products).reduce((acc, [key, val]) => {
            if (val.checkout_product_id) acc[val.checkout_product_id] = key;
            return acc;
        }, {});


        // 🔁 Build reverse lookup: { SKU: productKey }
        const skuToProductKey = Object.entries(products).reduce((acc, [key, val]) => {
            if (val.product_id) acc[val.product_id] = key; // product_id = SKU
            return acc;
        }, {});


        let line_items = [];

        if (Array.isArray(cart)) {
            // Load promotion.json once outside the loop
            const promoPath = path.join(process.cwd(), 'products', 'promotion.json');
            let promo = null;
            if (fs.existsSync(promoPath)) {
                const promoRaw = fs.readFileSync(promoPath, 'utf8');
                promo = JSON.parse(promoRaw.replace(/^\uFEFF/, ''));
            }

            line_items = cart.map(item => {
                const productKey = checkoutToProductKey[item.id] || skuToProductKey[item.id] || item.id;
                const product = products[productKey];
                if (!product) return null;

                const variant = item.variant?.trim();
                const image = product.variantImages?.[variant] || product.image;
                const name = variant ? `${product.name} - ${variant}` : product.name;
                const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";

                // Apply promo logic
                // Find the best matching promotion for the product
                const activePromos = (promo?.promotions || []).filter(p =>
                    (!p.startDate || new Date() >= new Date(p.startDate)) &&
                    (!p.endDate || new Date() <= new Date(p.endDate)) &&
                    (!p.category || p.category === product.category) &&
                    (!p.condition?.minPrice || product.price >= p.condition.minPrice) &&
                    (!p.condition?.maxPrice || product.price <= p.condition.maxPrice)
                );

                // Use the first match, or you can sort by priority if you add a `priority` field later
                const activePromo = activePromos[0];

                let finalPrice = product.price;
                if (activePromo) {
                    if (activePromo.type === "percent") {
                        finalPrice = product.price * (1 - activePromo.amount / 100);
                    } else if (activePromo.type === "fixed") {
                        finalPrice = Math.max(0, product.price - activePromo.amount);
                    }
                }


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
                        unit_amount: Math.round(finalPrice * 100)
                    },
                    quantity: item.qty || 1
                };
            }).filter(Boolean);
        }   
         else if (sku) {
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
            discounts: coupon ? [{ coupon }] : undefined,
            allow_promotion_codes: !coupon, // fallback if no specific code given
            shipping_options,
            success_url: "https://www.karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://www.karrykraze.com/pages/cancel.html"
        };

        /*
// ✅ Now apply either discounts OR allow_promotion_codes
if (subtotal >= 6000) {
    sessionOptions.discounts = [
        { promotion_code: "promo_1RQGELLzNgqX2t8K1ROge1Er" }
    ];
} else {
    sessionOptions.allow_promotion_codes = true;
}
*/

        const session = await stripe.checkout.sessions.create(sessionOptions);
        return res.status(200).json({ url: session.url });

    } catch (err) {
        console.error("Stripe session error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
