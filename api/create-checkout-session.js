import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
    api: { bodyParser: true }
};

export default async function handler(req, res) {
    const allowedOrigins = ["https://karrykraze.com", "https://www.karrykraze.com"];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

    try {
        const { sku, selectedVariant, cart, coupon } = req.body;

        const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products', 'products.json'), 'utf8'));
        const promotionsData = fs.existsSync(path.join(process.cwd(), 'products', 'promotions.json')) ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products', 'promotions.json'), 'utf8')) : { promotions: [] };
        const bundles = fs.existsSync(path.join(process.cwd(), 'products', 'bundles.json')) ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products', 'bundles.json'), 'utf8')) : [];

        const skuToProductKey = Object.fromEntries(Object.entries(products).filter(([_, val]) => val.product_id).map(([k, v]) => [v.product_id, k]));

        let line_items = [];

        if (Array.isArray(cart)) {
            const now = new Date();
            const flatCart = cart.flatMap(item => Array.from({ length: item.qty || 1 }, () => ({ ...item, _used: false })));

            const getCategory = id => products[skuToProductKey[id] || id]?.category;

            // Apply bundles
            for (const bundle of bundles) {
                for (let useCount = 0; useCount < (bundle.maxUses || 1); useCount++) {
                    let match = [];

                    if (bundle.category && bundle.minQuantity) {
                        match = flatCart.filter(i => !i._used && getCategory(i.id) === bundle.category && !bundle.excludeSkus?.includes(i.id)).slice(0, bundle.minQuantity);
                    } else if (bundle.requiredCategories) {
                        match = bundle.requiredCategories.map(cat => flatCart.find(i => !i._used && getCategory(i.id) === cat && !bundle.excludeSkus?.includes(i.id)));
                        if (match.includes(undefined)) match = [];
                    }

                    if (match.length && !match.includes(undefined)) {
                        const bundleUnitPrice = bundle.bundlePriceTotal / match.length;
                        match.forEach(i => {
                            i.price = parseFloat(bundleUnitPrice.toFixed(2));
                            i.bundleLabel = bundle.name;
                            i._used = true;
                        });
                    }
                }
            }

            // Apply promotions to non-bundled items
            for (const promo of promotionsData.promotions || []) {
                const start = new Date(promo.startDate);
                const end = new Date(promo.endDate);
                const isActive = !promo.startDate || (!isNaN(start) && !isNaN(end) && now >= start && now <= end);

                if (isActive) {
                    flatCart.forEach(i => {
                        const product = products[skuToProductKey[i.id] || i.id];
                        if (product && !i._used && getCategory(i.id) === promo.category) {
                            const meetsMin = !promo.condition?.minPrice || product.price >= promo.condition.minPrice;
                            const meetsMax = !promo.condition?.maxPrice || product.price <= promo.condition.maxPrice;
                            if (meetsMin && meetsMax) {
                                const discount = promo.type === 'percent' ? product.price * (promo.amount / 100) : promo.amount;
                                i.price = parseFloat((product.price - discount).toFixed(2));
                                i.promoLabel = promo.name;
                            }
                        }
                    });
                }
            }

            const groupedItems = flatCart.reduce((acc, item) => {
                const key = `${item.id}_${item.variant || ''}_${item.bundleLabel || ''}_${item.promoLabel || ''}`;
                if (!acc[key]) acc[key] = { ...item, quantity: 1 };
                else acc[key].quantity += 1;
                return acc;
            }, {});

            for (const item of Object.values(groupedItems)) {
                const product = products[skuToProductKey[item.id] || item.id];
                if (!product) continue;

                const variant = item.variant?.trim();
                const image = product.variantImages?.[variant] || product.image;
                const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";

                const unitAmount = item.price;
                const priceData = {
                    currency: "usd",
                    product_data: {
                        name: item.bundleLabel ? `${item.name} (${item.bundleLabel})` : item.name,
                        description,
                        images: [image],
                        metadata: {
                            variant: variant || "N/A",
                            product_id: skuToProductKey[item.id] || item.id,
                            requires_shipping: "true",
                            clean_name: product.name,
                            ...(item.bundleLabel ? { bundle_applied: item.bundleLabel } : {}),
                            ...(item.promoLabel ? { promotion_applied: item.promoLabel } : {})
                        }
                    },
                    unit_amount: Math.round(Math.max(0, unitAmount) * 100)
                };

                line_items.push({ price_data: priceData, quantity: item.quantity });
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
        console.error("Stripe session error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
