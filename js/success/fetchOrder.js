export async function fetchOrderDetails(sessionId) {
  const res = await fetch(`https://buy.karrykraze.com/api/get-order?session_id=${sessionId}`);
  if (!res.ok) throw new Error("Invalid session or network issue");
  return res.json();
}
