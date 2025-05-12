const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const config = {
    api: { bodyParser: true },
};

export default async function handler(req, res) {
    // ✅ Always send CORS headers, no matter the method
    res.setHeader('Access-Control-Allow-Origin', 'https://www.karrykraze.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // ✅ Reply immediately to OPTIONS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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

            return res.status(200).json({ url: session.url });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
    }

    // For anything that's not POST or OPTIONS
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
}
