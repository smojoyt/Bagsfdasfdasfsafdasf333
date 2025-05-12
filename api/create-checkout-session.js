const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const products = {
    "Bag_MiniHeart": {
        name: "Mini Tote - Heart Embossed",
        price: 1999
    },
    // Add more products here
};

module.exports = async (req, res) => {
    if (req.method === "POST") {
        try {
            const { sku } = req.body;
            const product = products[sku];

            if (!product) {
                return res.status(400).json({ error: "Invalid SKU" });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                        },
                        unit_amount: product.price
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
