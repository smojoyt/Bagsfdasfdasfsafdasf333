const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'Mini Tote - Test Product',
                            },
                            unit_amount: 1999, // $19.99
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${req.headers.origin}/`,
                cancel_url: `${req.headers.origin}/`,
            });

            res.status(200).json({ url: session.url });
        } catch (err) {
            console.error("Stripe error:", err.message);
            res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
};
