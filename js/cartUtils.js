async function bundleDetector(cart) {
    try {
        const [bundleRes, productRes, promoRes] = await Promise.all([
            fetch("/products/bundles.json"),
            fetch("/products/products.json"),
            fetch("/products/promotion.json")
        ]);

        const bundles = await bundleRes.json();
        const products = await productRes.json();
        const { promotions } = await promoRes.json();
        const now = new Date();

        const idToCategory = {};
        const idToPrice = {};
        const idToKey = {}; // product_id → product key

        for (const key in products) {
            const prod = products[key];
            if (prod.product_id && prod.category) {
                idToCategory[prod.product_id] = prod.category;
                idToPrice[prod.product_id] = prod.price;
                idToKey[prod.product_id] = key;
            }
        }

        const flatCart = [];
        for (const item of cart) {
            const qty = item.qty || 1;
            const category = idToCategory[item.id] || "";
            const productKey = idToKey[item.id] || "";
            const basePrice = idToPrice[item.id];
            for (let i = 0; i < qty; i++) {
                flatCart.push({
                    ...item,
                    qty: 1,
                    _used: false,
                    category,
                    productKey,
                    price: basePrice
                });
            }
        }

        // --- APPLY BUNDLES ---
        for (const bundle of bundles) {
            const maxUses = bundle.maxUses || 1;

            for (let useCount = 0; useCount < maxUses; useCount++) {
                let match = [];

                if (bundle.category && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        i.category === bundle.category &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);
                } else if (bundle.specificSkus && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used &&
                        bundle.specificSkus.includes(i.productKey) &&
                        (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                    ).slice(0, bundle.minQuantity);
                } else if (bundle.requiredCategories) {
                    match = bundle.requiredCategories.map(cat =>
                        flatCart.find(i =>
                            !i._used &&
                            i.category === cat &&
                            !(bundle.excludeSkus || []).includes(i.id)
                        )
                    );
                    if (match.includes(undefined)) match = [];
                }

                if (match.length === (bundle.minQuantity || match.length) && !match.includes(undefined)) {
                    let newPrice = null;

                    if (bundle.bundlePriceTotal) {
                        // Split fixed total price across matched items
                        const unitPrice = bundle.bundlePriceTotal / match.length;
                        match.forEach(i => {
                            i.price = parseFloat(unitPrice.toFixed(2));
                        });
                    } else if (bundle.bundlePercentOff) {
                        // Apply percent discount across total price of matched items
                        const totalPrice = match.reduce((sum, item) => sum + item.price, 0);
                        const discountPerItem = (totalPrice * (bundle.bundlePercentOff / 100)) / match.length;
                        match.forEach(i => {
                            i.price = parseFloat((i.price - discountPerItem).toFixed(2));
                        });
                    }

                    match.forEach(i => {
                        i.bundleLabel = bundle.name;
                        i._used = true;
                    });

                }
            }
        }

        // --- APPLY PROMOTIONS (not used in bundles) ---
        for (const promo of promotions) {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = !promo.startDate || (!isNaN(start) && !isNaN(end) && now >= start && now <= end);

            if (isActive && promo.type === "percent") {
                flatCart.forEach(i => {
                    if (
                        !i._used &&
                        i.category === promo.category &&
                        (!promo.condition?.minPrice || i.price >= promo.condition.minPrice)
                    ) {
                        const discount = i.price * (promo.amount / 100);
                        i.price = parseFloat((i.price - discount).toFixed(2));
                        i.promoLabel = promo.name;
                    }
                });
            }
        }

        // --- CLEAN LABELS BEFORE GROUPING ---
        // At the end of bundleDetector
        flatCart.forEach(item => {
            if (!item._used && bundles) {
                for (const bundle of bundles) {
                    let isMatch = false;
                    let remaining = 0;

                    if (bundle.category && item.category === bundle.category) {
                        const eligibleItems = flatCart.filter(i =>
                            !i._used &&
                            i.category === item.category &&
                            (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                        );
                        remaining = (bundle.minQuantity || 0) - eligibleItems.length;
                        isMatch = remaining > 0;
                    } else if (bundle.specificSkus && bundle.specificSkus.includes(item.productKey)) {
                        const eligibleItems = flatCart.filter(i =>
                            !i._used &&
                            bundle.specificSkus.includes(i.productKey) &&
                            (!bundle.excludeSkus || !bundle.excludeSkus.includes(i.id))
                        );
                        remaining = (bundle.minQuantity || 0) - eligibleItems.length;
                        isMatch = remaining > 0;
                    }

                    if (isMatch && remaining > 0) {
                        item.hint = `✨ Add ${remaining} more to get ${bundle.name}`;
                    }
                }
            }

        });


        // --- GROUP BY FINAL PRICE + LABELS ---
        const grouped = {};
        flatCart.forEach(item => {
            const key = `${item.id}_${item.variant || ""}_${item.price}_${item.bundleLabel || ""}_${item.promoLabel || ""}`;
            if (!grouped[key]) grouped[key] = { ...item, qty: 1 };
            else grouped[key].qty++;
        });


        return Object.values(grouped);
    } catch (e) {
        console.error("bundleDetector failed:", e);
        return cart;
    }
}

module.exports = { bundleDetector };