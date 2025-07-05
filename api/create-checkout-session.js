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

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

    try {
        console.log("Incoming body:", req.body);
        const { sku, selectedVariant, cart, coupon } = req.body;

        const filePath = path.join(process.cwd(), 'products', 'products.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(rawData);

        const checkoutToProductKey = Object.entries(products).reduce((acc, [key, val]) => {
            if (val.checkout_product_id) acc[val.checkout_product_id] = key;
            return acc;
        }, {});

        const skuToProductKey = Object.entries(products).reduce((acc, [key, val]) => {
            if (val.product_id) acc[val.product_id] = key;
            return acc;
        }, {});

        let line_items = [];

        if (Array.isArray(cart)) {
            const promoPath = path.join(process.cwd(), 'products', 'promotion.json');
            let promo = null;
            if (fs.existsSync(promoPath)) {
                const promoRaw = fs.readFileSync(promoPath, 'utf8');
                promo = JSON.parse(promoRaw.replace(/^﻿/, ''));
            }

            const bundlePath = path.join(process.cwd(), 'products', 'bundles.json');
            let bundles = [];
            if (fs.existsSync(bundlePath)) {
                const rawBundle = fs.readFileSync(bundlePath, 'utf8');
                bundles = JSON.parse(rawBundle.replace(/^﻿/, ''));
            }

            const flatCart = [];
            for (const item of cart) {
                const quantity = item.qty || 1;
                for (let i = 0; i < quantity; i++) {
                    flatCart.push({ ...item, _used: false });
                }
            }

            const appliedBundles = [];
            const bundleLimit = {};

            const getProductCategory = (id) => {
                const key = checkoutToProductKey[id] || skuToProductKey[id] || id;
                return products[key]?.category || null;
            };

            const matches = (item, filter) => {
                const productKey = skuToProductKey[item.id] || item.id;
                const product = products[productKey];
                if (!product) return false;
                if (filter.excludeSkus?.includes(productKey)) return false;
                if (filter.category && getProductCategory(productKey) !== filter.category) return false;
                return true;
            };

            for (const bundle of bundles) {
                let matchedItems = [];
                const maxUses = bundle.maxUses || 1;

                for (let useCount = 0; useCount < maxUses; useCount++) {
                    let match = [];

                    if (bundle.category && bundle.minQuantity) {
                        match = flatCart.filter(i => !i._used && matches(i, bundle)).slice(0, bundle.minQuantity);
                    } else if (bundle.requiredCategories) {
                        match = bundle.requiredCategories.map(cat =>
                            flatCart.find(i => !i._used && getProductCategory(i.id) === cat &&
                                !(bundle.excludeSkus || []).includes(i.id))
                        );
                        if (match.includes(undefined)) match = [];
                    }

                    if (match.length > 0 && !match.includes(undefined)) {
                        match.forEach(i => i._used = true);
                        appliedBundles.push({ bundle, items: match });
                    }
                }
            }

            const groupedItems = new Map();

            for (const item of flatCart) {
                const key = `${item.id}_${item.variant || ''}_${item._used}`;
                if (groupedItems.has(key)) {
                    groupedItems.get(key).quantity++;
                } else {
                    groupedItems.set(key, { ...item, quantity: 1 });
                }
            }

            for (const item of groupedItems.values()) {
                const productKey = checkoutToProductKey[item.id] || skuToProductKey[item.id] || item.id;
                const product = products[productKey];
                if (!product) continue;

                const variant = item.variant?.trim();
                const image = product.variantImages?.[variant] || product.image;
                const name = variant ? `${product.name} - ${variant}` : product.name;
                const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";

                let unitAmount = product.price;
                let bundleNote = null;

                for (const { bundle, items } of appliedBundles) {
                    if (items.includes(item)) {
                        // Apply bundle pricing
                        if (bundle.bundlePriceTotal) {
                            unitAmount = bundle.bundlePriceTotal / items.length;
                        } else if (bundle.discountType === "flat" && bundle.discountAmount) {
                            unitAmount -= bundle.discountAmount / items.length;
                        } else if (bundle.discountType === "percent" && bundle.discountPercent) {
                            unitAmount *= (1 - bundle.discountPercent / 100);
                        } else if (bundle.discountType === "setPriceToZero" &&
                            bundle.applyTo === getProductCategory(item.id)) {
                            unitAmount = 0;
                        }

                        bundleNote = bundle.name;
                        break;
                    }
                }

                const priceData = {
                    currency: "usd",
                    product_data: {
                        name,
                        description,
                        images: [image],
                        metadata: {
                            variant: variant || "N/A",
                            product_id: productKey,
                            requires_shipping: "true",
                            clean_name: product.name,
                            ...(bundleNote ? { bundle_applied: bundleNote } : {})
                        }
                    },
                    unit_amount: Math.round(Math.max(0, unitAmount) * 100)
                };

                // ✅ Attach bundle label to original item (for localStorage if needed)
                if (!item.bundleLabel && bundleNote) {
                    item.bundleLabel = bundleNote;
                }

                line_items.push({
                    price_data: priceData,
                    quantity: 1
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
            { shipping_rate: 'shr_1RO9juLzNgqX2t8KonaNgulK' },
            { shipping_rate: 'shr_1RO9kSLzNgqX2t8K0SOnswvh' }
        ];

        if (subtotal >= 2500) {
            shipping_options.unshift({ shipping_rate: 'shr_1RO9lyLzNgqX2t8KUr7X1RJh' });
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
            phone_number_collection: { enabled: true },
            discounts: coupon ? [{ coupon }] : undefined,
            allow_promotion_codes: !coupon,
            shipping_options,
            success_url: "https://www.karrykraze.com/pages/success.html?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://www.karrykraze.com/pages/cancel.html"
        };

        const session = await stripe.checkout.sessions.create(sessionOptions);
        return res.status(200).json({ url: session.url });

    } catch (err) {
        console.error("Stripe session error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



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