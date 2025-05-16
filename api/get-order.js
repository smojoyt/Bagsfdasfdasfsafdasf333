const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // CORS setup for GET from www.karrykraze.com
    res.setHeader("Access-Control-Allow-Origin", "https://www.karrykraze.com");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['customer'],
        });

        const lineItems = await stripe.checkout.sessions.listLineItems(session_id, {
            limit: 100,
        });

        res.status(200).json({
            customer_name: session.customer_details.name,
            customer_email: session.customer_details.email,
            total: (session.amount_total / 100).toFixed(2),
            currency: session.currency,
            items: lineItems.data.map(item => ({
                name: item.description,
                quantity: item.quantity,
                amount_total: (item.amount_total / 100).toFixed(2),
            }))
        });
    } catch (err) {
        console.error('Error fetching order summary:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}
