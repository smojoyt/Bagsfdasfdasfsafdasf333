const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const config = {
    api: { bodyParser: true },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.karrykraze.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const item = req.body.item;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.name,
                            images: [item.image],
                        },
                        unit_amount: item.amount,
                    },
                    quantity: item.quantity,
                }],
                mode: 'payment',
                success_url: `${req.headers.origin}/success`,
                cancel_url: `${req.headers.origin}/cancel`,
            });

            res.status(200).json({ url: session.url });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
