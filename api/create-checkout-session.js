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
        const checkoutToProductKey = Object.fromEntries(Object.entries(products).filter(([_, val]) => val.checkout_product_id).map(([k, v]) => [v.checkout_product_id, k]));
        const skuToProductKey = Object.fromEntries(Object.entries(products).filter(([_, val]) => val.product_id).map(([k, v]) => [v.product_id, k]));

        let line_items = [];

        if (Array.isArray(cart)) {
            const promo = fs.existsSync(path.join(process.cwd(), 'products', 'promotion.json')) ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products', 'promotion.json'), 'utf8').replace(/^﻿/, '')) : null;
            const bundles = fs.existsSync(path.join(process.cwd(), 'products', 'bundles.json')) ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products', 'bundles.json'), 'utf8').replace(/^﻿/, '')) : [];

            const flatCart = cart.flatMap(item => Array.from({ length: item.qty || 1 }, () => ({ ...item, _used: false })));
            const getProductCategory = id => products[checkoutToProductKey[id] || skuToProductKey[id] || id]?.category || null;
            const matches = (item, filter) => {
                const productKey = skuToProductKey[item.id] || item.id;
                const product = products[productKey];
                if (!product) return false;
                return !filter.excludeSkus?.includes(productKey) && (!filter.category || getProductCategory(productKey) === filter.category);
            };

            const appliedBundles = [];
            for (const bundle of bundles) {
                for (let useCount = 0; useCount < (bundle.maxUses || 1); useCount++) {
                    let match = bundle.category && bundle.minQuantity
                        ? flatCart.filter(i => !i._used && matches(i, bundle)).slice(0, bundle.minQuantity)
                        : bundle.requiredCategories?.map(cat => flatCart.find(i => !i._used && getProductCategory(i.id) === cat && !bundle.excludeSkus?.includes(i.id))) || [];
                    if (!match.includes(undefined) && match.length) {
                        match.forEach(i => i._used = true);
                        appliedBundles.push({ bundle, items: match });
                    }
                }
            }

            const groupedItems = flatCart.reduce((acc, item) => {
                const key = `${item.id}_${item.variant || ''}_${item._used}`;
                acc[key] = acc[key] ? { ...acc[key], quantity: acc[key].quantity + 1 } : { ...item, quantity: 1 };
                return acc;
            }, {});

            for (const item of Object.values(groupedItems)) {
                const productKey = checkoutToProductKey[item.id] || skuToProductKey[item.id] || item.id;
                const product = products[productKey];
                if (!product) continue;

                const variant = item.variant?.trim();
                const image = product.variantImages?.[variant] || product.image;
                const name = variant ? `${product.name} - ${variant}` : product.name;
                const description = product.descriptionList?.join(" | ") || product.description || "Karry Kraze item";
                let unitAmount = product.price;

                if (promo?.promotions?.length) {
                    const now = new Date();
                    for (const p of promo.promotions) {
                        const inRange = now >= new Date(p.startDate || '1900') && now <= new Date(p.endDate || '2100');
                        if (inRange && product.category === p.category && (!p.condition?.minPrice || unitAmount >= p.condition.minPrice) && (!p.condition?.maxPrice || unitAmount <= p.condition.maxPrice)) {
                            unitAmount = p.type === "percent" ? unitAmount * (1 - p.amount / 100) : unitAmount - p.amount;
                            break;
                        }
                    }
                }

                let bundleNote = null;
                for (const { bundle, items } of appliedBundles) {
                    if (items.includes(item)) {
                        if (bundle.bundlePriceTotal) unitAmount = bundle.bundlePriceTotal / items.length;
                        else if (bundle.discountType === "flat") unitAmount -= bundle.discountAmount / items.length;
                        else if (bundle.discountType === "percent") unitAmount *= (1 - bundle.discountPercent / 100);
                        else if (bundle.discountType === "setPriceToZero" && bundle.applyTo === getProductCategory(item.id)) unitAmount = 0;
                        bundleNote = bundle.name;
                        break;
                    }
                }

                line_items.push({
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: bundleNote ? `${name} (${bundleNote})` : name,
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
                    },
                    quantity: item.quantity || 1
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
                            clean_name: product.name,
                            ...(product.tags?.includes("Onsale") ? { onsale: "true" } : {})
                        }
                    },
                    unit_amount: Math.round((product.tags?.includes("Onsale") && product.sale_price < product.price ? product.sale_price : product.price) * 100)
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
