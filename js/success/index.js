import { fetchOrderDetails } from './fetchOrder.js';
import { renderOrder } from './renderOrder.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") || localStorage.getItem("last_session_id");

  if (!sessionId) {
    document.getElementById("orderItems").innerHTML = `<p class="text-red-500">Missing session ID.</p>`;
    return;
  }

  try {
    const order = await fetchOrderDetails(sessionId);
    localStorage.setItem("last_session_id", sessionId);
    localStorage.removeItem("cart");
    localStorage.removeItem("savedCart");

    renderOrder(order);
  } catch (err) {
    console.error("Failed to load order:", err);
    document.getElementById("orderItems").innerHTML = `<p class="text-red-500">Could not load order summary.</p>`;
  }
});
