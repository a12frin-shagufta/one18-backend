export const buildOrderDetailsHTML = (order) => {
  const itemsHtml = order.items.map(i => `
    <tr>
      <td>${i.name} ${i.variant ? `(${i.variant})` : ""}</td>
      <td>${i.qty}</td>
      <td>SGD ${i.price}</td>
      <td>SGD ${(i.price * i.qty).toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial; line-height:1.6">
      <h2>Order Details</h2>

      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Type:</b> ${order.fulfillmentType}</p>
      <p><b>Date:</b> ${order.fulfillmentDate}</p>
      <p><b>Time:</b> ${order.fulfillmentTime}</p>

      ${
        order.fulfillmentType === "delivery"
          ? `
          <h3>Delivery Address</h3>
          <p>${order.customer.address}</p>
          <p>Postal: ${order.customer.postalCode}</p>
        `
          : `
          <h3>Pickup Branch</h3>
          <p>${order.pickupLocation?.name}</p>
          <p>${order.pickupLocation?.address}</p>
        `
      }

      <table width="100%" border="1" cellpadding="6" cellspacing="0">
        <tr>
          <th align="left">Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
        ${itemsHtml}
      </table>

      <p><b>Subtotal:</b> SGD ${order.subtotal.toFixed(2)}</p>
      <p><b>Delivery Fee:</b> SGD ${(order.deliveryFee || 0).toFixed(2)}</p>
      <h3>Total: SGD ${order.totalAmount.toFixed(2)}</h3>
    </div>
  `;
};
