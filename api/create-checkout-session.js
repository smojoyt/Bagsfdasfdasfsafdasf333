const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method === "POST") {
        try {
            const { sku, selectedVariant } = req.body;

            const filePath = path.join(process.cwd(), 'products', 'products.json');
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const products = JSON.parse(rawData);

            const product = products[sku];

            if (!product) {
                return res.status(400).json({ error: "Invalid SKU" });
            }

            // Fallback image logic
            let productImage = product.image;
            if (selectedVariant && product.variantImages && product.variantImages[selectedVariant]) {
                productImage = product.variantImages[selectedVariant];
            }

            const variantText = selectedVariant ? ` (${product.custom1Name}: ${selectedVariant})` : "";

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${product.name}${variantText}`,
                            description: product.descriptionList.join(' • '),
                            images: [productImage]
                        },
                        unit_amount: Math.round(product.price * 100) // Convert to cents
                    },
                    quantity: 1
                }],
                mode: 'payment',
                success_url: `https://www.karrykraze.com/`,
                cancel_url: `https://www.karrykraze.com/`,
            });

            res.status(200).json({ url: session.url });
        } catch (err) {
            console.error("Stripe error:", err.message);
            res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
};
