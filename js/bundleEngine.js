window.checkBundleAvailability = async function (bundleId) {
    logCart(`🔍 Checking availability for bundle "${bundleId}"`);

    try {
        const [bundleRes, productRes] = await Promise.all([
            fetch("/products/bundles.json"),
            fetch("/products/products.json")
        ]);

        const bundles = await bundleRes.json();
        const products = await productRes.json();

        const bundle = bundles.find(b => b.id === bundleId);
        if (!bundle) {
            warnCart(`⚠️ Bundle not found: ${bundleId}`);
            return false;
        }

        const hasInStockVariant = product =>
            product && Object.values(product.variantStock || {}).some(qty => qty > 0);

        // Check based on requiredSubCategories
        if (bundle.requiredSubCategories) {
            const allAvailable = bundle.requiredSubCategories.every(sub =>
                Object.values(products).some(p =>
                    p.subCategory === sub && hasInStockVariant(p)
                )
            );
            logCart(`📦 Bundle "${bundleId}" requiredSubCategories availability:`, allAvailable);
            return allAvailable;
        }

        // Check based on subCategory
        if (bundle.subCategory) {
            const available = Object.values(products).some(p =>
                p.subCategory === bundle.subCategory && hasInStockVariant(p)
            );
            logCart(`📦 Bundle "${bundleId}" subCategory availability:`, available);
            return available;
        }

        // Check based on specificSkus
        if (bundle.specificSkus) {
            const available = bundle.specificSkus.some(sku => hasInStockVariant(products[sku]));
            logCart(`📦 Bundle "${bundleId}" SKU availability:`, available);
            return available;
        }

        logCart(`✅ No restriction logic on bundle "${bundleId}" — assumed available`);
        return true;
    } catch (err) {
        errorCart(`❌ Error checking bundle availability for "${bundleId}":`, err);
        return false;
    }
};



async function bundleDetector(cart) {
    logCart("🔎 Starting bundleDetector for cart:", cart);

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

        // Build product lookup maps
        const idToCategory = {}, idToSubCategory = {}, idToPrice = {}, idToKey = {};
        for (const key in products) {
            const p = products[key];
            if (!p.product_id) continue;

            idToCategory[p.product_id] = p.category || "";
            idToSubCategory[p.product_id] = p.subCategory || "";
            idToPrice[p.product_id] = p.price;
            idToKey[p.product_id] = key;
        }

        // Flatten cart into individual units
        const flatCart = [];
        for (const item of cart) {
            const qty = item.qty || 1;
            for (let i = 0; i < qty; i++) {
                flatCart.push({
                    ...item,
                    qty: 1,
                    _used: false,
                    category: idToCategory[item.id] || "",
                    subCategory: idToSubCategory[item.id] || "",
                    productKey: idToKey[item.id] || "",
                    price: idToPrice[item.id] ?? item.price ?? 0
                });
            }
        }

        // 🧠 Apply Bundle Rules
        for (const bundle of bundles) {
            const maxUses = bundle.maxUses || 1;

            for (let useCount = 0; useCount < maxUses; useCount++) {
                let match = [];

                const isExcluded = item => bundle.excludeSkus?.includes(item.id);

                // Match logic
                if (bundle.subCategory && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used && i.subCategory === bundle.subCategory && !isExcluded(i)
                    ).slice(0, bundle.minQuantity);

                } else if (bundle.category && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used && i.category === bundle.category && !isExcluded(i)
                    ).slice(0, bundle.minQuantity);

                } else if (bundle.specificSkus && bundle.minQuantity) {
                    match = flatCart.filter(i =>
                        !i._used && bundle.specificSkus.includes(i.productKey) && !isExcluded(i)
                    ).slice(0, bundle.minQuantity);

                } else if (bundle.requiredSubCategories) {
                    const matchList = [];

                    for (const sub of bundle.requiredSubCategories) {
                        const found = flatCart.find(i =>
                            !i._used && i.subCategory === sub && !isExcluded(i)
                        );
                        if (found) matchList.push(found);
                    }

                    if (matchList.length === bundle.requiredSubCategories.length) {
                        logCart(`✅ Bundle "${bundle.name}" matched required subCategories`);

                        if (bundle.priceRule === "charmFree" && bundle.discountTarget) {
                            matchList.forEach(i => {
                                if (i.subCategory === bundle.discountTarget) {
                                    i.price = 0;
                                    i.bundleLabel = bundle.name;
                                    i._used = true;
                                }
                            });
                        } else {
                            const unit = bundle.bundlePriceTotal / matchList.length;
                            matchList.forEach(i => {
                                i.price = parseFloat(unit.toFixed(2));
                                i.bundleLabel = bundle.name;
                                i._used = true;
                            });
                        }

                        continue; // skip rest if special rule applied
                    } else {
                        logCart(`⛔ Skipped bundle "${bundle.name}" — not all required subcategories found`);
                    }
                }

                // Default match handling
                if (match.length === (bundle.minQuantity || match.length) && !match.includes(undefined)) {
                    const unit = bundle.bundlePriceTotal / match.length;
                    match.forEach(i => {
                        i.price = parseFloat(unit.toFixed(2));
                        i.bundleLabel = bundle.name;
                        i._used = true;
                    });
                    logCart(`✅ Bundle "${bundle.name}" applied to ${match.length} item(s)`);
                }
            }
        }

        // 🏷️ Apply Promotions
        for (const promo of promotions) {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            const isActive = !promo.startDate || (!isNaN(start) && !isNaN(end) && now >= start && now <= end);

            if (!isActive || promo.type !== "percent") continue;

            flatCart.forEach(i => {
                const meetsMin = !promo.condition?.minPrice || i.price >= promo.condition.minPrice;
                if (!i._used && i.category === promo.category && meetsMin) {
                    const discount = i.price * (promo.amount / 100);
                    i.price = parseFloat((i.price - discount).toFixed(2));
                    i.promoLabel = promo.name;
                    logCart(`🔖 Promo "${promo.name}" applied to ${i.id}`);
                }
            });
        }

        // Clear unused bundle/promo labels
        flatCart.forEach(i => {
            if (!i._used) {
                i.bundleLabel = "";
                i.promoLabel = "";
            }
        });

        // Group back into quantity sets
        const grouped = {};
        flatCart.forEach(item => {
            const key = `${item.id}_${item.variant || ""}_${item.price}_${item.bundleLabel || ""}_${item.promoLabel || ""}`;
            if (!grouped[key]) {
                grouped[key] = { ...item, qty: 1 };
            } else {
                grouped[key].qty++;
            }
        });

        const result = Object.values(grouped);
        logCart("✅ Final bundled cart:", result);
        return result;

    } catch (err) {
        errorCart("❌ bundleDetector failed:", err);
        return cart;
    }
}






window.applyBundle = async function (bundleId) {
    logCart(`🧩 User clicked bundle "${bundleId}"`);

    try {
        const [bundleRes, productRes] = await Promise.all([
            fetch("/products/bundles.json"),
            fetch("/products/products.json")
        ]);

        const bundles = await bundleRes.json();
        const products = await productRes.json();
        const cart = JSON.parse(localStorage.getItem("savedCart")) || [];

        const bundle = bundles.find(b => b.id === bundleId);
        if (!bundle) return warnCart(`⚠️ Bundle "${bundleId}" not found`);

        // 🔁 Build ID → product key lookup
        const idToKey = {};
        for (const key in products) {
            const p = products[key];
            if (p?.product_id) idToKey[p.product_id] = key;
        }

        // 💡 Add `key` field to all cart items
        cart.forEach(item => {
            item.key = idToKey[item.id];
        });

        const isExcluded = item => bundle.excludeSkus?.includes(item.id);
        const findFirst = (arr, fn) => arr.find(i => fn(i) && !i.bundleLabel);

        let matched = [];

        // 🔍 Match by required subcategories (A + B style bundle)
        if (bundle.requiredSubCategories) {
            for (const sub of bundle.requiredSubCategories) {
                const found = findFirst(cart, item => {
                    const product = products[item.key];
                    const isMatch = product?.subCategory === sub && !isExcluded(item);
                    logCart(`🧪 Matching subCategory "${sub}" against "${item.id}" → ${isMatch}`);
                    return isMatch;
                });
                if (found) matched.push(found);
            }

            if (matched.length !== bundle.requiredSubCategories.length) {
                return warnCart(`⛔ Bundle "${bundle.name}" not applied – missing required subcategories`);
            }

        } else if (bundle.subCategory && bundle.minQuantity) {
            matched = cart.filter(item => {
                const product = products[item.key];
                return !item.bundleLabel && product?.subCategory === bundle.subCategory && !isExcluded(item);
            }).slice(0, bundle.minQuantity);

        } else if (bundle.category && bundle.minQuantity) {
            matched = cart.filter(item => {
                const product = products[item.key];
                return !item.bundleLabel && product?.category === bundle.category && !isExcluded(item);
            }).slice(0, bundle.minQuantity);

        } else if (bundle.specificSkus && bundle.minQuantity) {
            matched = cart.filter(item =>
                !item.bundleLabel && bundle.specificSkus.includes(item.key) && !isExcluded(item)
            ).slice(0, bundle.minQuantity);
        }

        if (matched.length === 0) {
            return warnCart(`⚠️ No eligible items found for bundle "${bundle.name}"`);
        }

        // 💰 Apply pricing
        const totalBefore = matched.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const unitDiscount = parseFloat((bundle.bundlePriceTotal / matched.length).toFixed(2));
        const bundleLabel = bundle.name || "Bundle";

        matched.forEach(item => {
            item.price = unitDiscount;
            item.bundleLabel = bundleLabel;
        });

        logCart(`✅ Bundle "${bundleLabel}" applied:`, {
            before: `$${totalBefore.toFixed(2)}`,
            after: `$${bundle.bundlePriceTotal.toFixed(2)}`,
            appliedTo: matched.map(i => i.name || i.id)
        });

        localStorage.setItem("savedCart", JSON.stringify(cart));
        renderCart();

    } catch (err) {
        errorCart(`❌ applyBundle failed for "${bundleId}":`, err);
    }
};



// Export to global scope for other modules (if not using bundler)
window.bundleDetector = bundleDetector;
window.checkBundleAvailability = checkBundleAvailability;
window.applyBundle = applyBundle;
