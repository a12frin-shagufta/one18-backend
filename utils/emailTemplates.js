export const buildOrderDetailsHTML = (order) => {
const itemsHtml = order.items.map(i => {
  const cakeMsg = i.cakeMessage
    ? `<br/><small style="color:#d63384">🎂 "${i.cakeMessage}" (+SGD 5.00)</small>`
    : "";

  // Quantity bundles need the count on the ticket, otherwise the kitchen sees
  // "+ Nutella, + Biscoff" with no idea how many of each to bake.
  const addOnsMsg = (i.addOns || [])
    .map(a => {
      const qty = Number(a.quantity) || 1;
      const count = qty > 1 ? ` &times; ${qty}` : "";
      const extra =
        a.price > 0 ? ` (+SGD ${(a.price * qty).toFixed(2)})` : "";
      return `<br/><small>+ ${a.label}${count}${extra}</small>`;
    })
    .join("");

  return `
    <tr>
      <td>${i.name} ${i.variant ? `(${i.variant})` : ""}${cakeMsg}${addOnsMsg}</td>
      <td align="center">${i.qty}</td>
      <td align="right">SGD ${(i.price * i.qty).toFixed(2)}</td>
    </tr>
  `;
}).join("");

  const customerBlock = `
    <h3>Customer Details</h3>
    <p>
      <b>Name:</b> ${order.customer?.firstName || ""} ${order.customer?.lastName || ""}<br/>
      <b>Email:</b> ${order.customer?.email || "-"}<br/>
      <b>Phone:</b> ${order.customer?.phone || "-"}
    </p>
  `;

  const deliveryBlock = `
    <h3>Delivery Address</h3>
    <p>
      ${order.customer?.address || ""}<br/>
      ${order.customer?.apartment ? "Apt: " + order.customer.apartment + "<br/>" : ""}
      Postal: ${order.customer?.postalCode || ""}<br/>
      Area: ${order.deliveryAddress?.area || ""}
    </p>
  `;

  const pickupBlock = `
    <h3>Pickup Branch</h3>
    <p>
      ${order.pickupLocation?.name || ""}<br/>
      ${order.pickupLocation?.address || ""}
    </p>
  `;

  return `
  <div style="font-family:Arial; max-width:700px; line-height:1.6">

    <h2>🧾 Order Confirmation</h2>

    <p><b>Order No:</b> ${order.orderNumber || order._id}</p>
    <p><b>Type:</b> ${order.fulfillmentType.toUpperCase()}</p>
    <p><b>Date:</b> ${order.fulfillmentDate}</p>
    <p><b>Time:</b> ${order.fulfillmentTime}</p>

    ${customerBlock}

    ${order.fulfillmentType === "delivery" ? deliveryBlock : pickupBlock}

    <h3>Items</h3>

    <table width="100%" border="1" cellpadding="8" cellspacing="0">
      <tr>
        <th align="left">Item</th>
        <th>Qty</th>
        <th align="right">Total</th>
      </tr>
      ${itemsHtml}
    </table>

    <br/>

    <p><b>Subtotal:</b> SGD ${order.subtotal.toFixed(2)}</p>
    <p><b>Delivery Fee:</b> SGD ${(order.deliveryFee || 0).toFixed(2)}</p>

    <h3>Total: SGD ${order.totalAmount.toFixed(2)}</h3>

  </div>
  `;
};