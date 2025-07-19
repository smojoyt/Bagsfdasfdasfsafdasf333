export function renderOrder(data) {
  const firstName = (data.customer_details?.name || "Customer").split(" ")[0];
  const email = data.customer_details?.email || "";

  document.getElementById("thankYouMessage").textContent = `THANK YOU, ${firstName.toUpperCase()}!`;
  document.getElementById("emailMessage").innerHTML = `A receipt has been sent to <strong>${email}</strong>`;

  const itemsContainer = document.getElementById("orderItems");
  const totalsContainer = document.getElementById("orderTotalContainer");

  itemsContainer.innerHTML = "";

  let subtotal = 0;
  data.line_items.forEach(item => {
    const unitTotal = (item.unit_amount * item.quantity) / 100;
    subtotal += unitTotal;

    const div = document.createElement("div");
    div.className = "flex justify-between items-start border-b py-4";

    div.innerHTML = `
      <div class="flex gap-4">
        <img src="${item.image || '/imgs/fallback.png'}" alt="${item.description}" class="w-16 h-16 rounded border object-cover">
        <div>
          <p class="font-semibold">${item.description}</p>
          <p class="text-sm text-gray-600">Qty: ${item.quantity}</p>
        </div>
      </div>
      <div class="text-right font-semibold whitespace-nowrap">$${unitTotal.toFixed(2)}</div>
    `;

    itemsContainer.appendChild(div);
  });

  const shipping = (data.shipping?.amount_total || 0) / 100;
  const discount = (data.total_details?.amount_discount || 0) / 100;
  const tax = (data.total_details?.amount_tax || 0) / 100;
  const totalPaid = subtotal + shipping + tax - discount;

  totalsContainer.classList.remove("hidden");
  totalsContainer.innerHTML = `
    <div class="text-sm space-y-2 text-gray-700">
      <div class="flex justify-between"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="flex justify-between"><span>Shipping</span><span>$${shipping.toFixed(2)}</span></div>
      <div class="flex justify-between"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>
      <div class="flex justify-between text-green-700"><span>Discount</span><span>- $${discount.toFixed(2)}</span></div>
    </div>
    <div class="flex justify-between mt-4 pt-4 border-t text-base font-bold">
      <span>Total Paid</span>
      <span>$${totalPaid.toFixed(2)}</span>
    </div>
  `;
}
