const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const config = {
    api: { bodyParser: true }
};

export default async function handler(req, res) {
    const allowedOrigins = [
        "https://www.karrykraze.com",
        "https://karrykraze.com"
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Vary", "Origin");

    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: "Missing session_id" });
    }

    try {
        // Fetch the Checkout Session
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['line_items.data.price.product', 'total_details.breakdown', 'customer', 'shipping']
        });

        // Include relevant data
        const responseData = {
            session_id: session.id,
            amount_total: session.amount_total,
            currency: session.currency,
            payment_status: session.payment_status,
            customer_details: session.customer_details,
            shipping: session.shipping,
            total_details: session.total_details,
            line_items: session.line_items.data.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_amount: item.price.unit_amount,
                metadata: item.price.product.metadata,
                image: item.price.product.images?.[0] || null
            })),
        };


        return res.status(200).json(responseData);

    } catch (err) {
        console.error("Stripe get-order error:", err);
        return res.status(500).json({ error: "Failed to retrieve order" });
    }
}
