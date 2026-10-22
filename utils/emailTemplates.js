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

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* Order notes were saved on every order but never included in this email,
     so instructions like "change 1x hot latte to hot teh tarik" reached the
     database and nowhere else. Placed above the items, and highlighted, so
     whoever reads or prints this sees it before the item list. */
  const note = order.customer?.message?.trim();
  const notesBlock = note
    ? `
    <div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:8px;padding:12px 16px;margin:16px 0">
      <p style="margin:0 0 4px;font-weight:bold;color:#92400e">📝 Order Notes</p>
      <p style="margin:0;color:#78350f;white-space:pre-wrap">${escapeHtml(note)}</p>
    </div>`
    : "";

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

  /* ==================================================================
     RECEIPT / TAX INVOICE
     ------------------------------------------------------------------
     Customers claiming this back from an employer need a receipt showing
     the business details and the payment, not just an order summary.

     Two rules this block exists to enforce:

     1. It only renders when the order is actually PAID. An unpaid or
        pending order has nothing to receipt.
     2. Every figure is read from the saved order — the same values the
        card was charged. There is deliberately no way to pass in a
        different amount, because a receipt that doesn't match what was
        charged isn't a receipt.

     Business details come from .env so they can be corrected without a
     deploy. BUSINESS_UEN matters most: a Singapore reimbursement claim is
     usually rejected without it.
  ================================================================== */
  const isPaid = order.paymentStatus === "paid";

  const paidOn = order.paidAt
    ? new Date(order.paidAt).toLocaleDateString("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const receiptBlock = isPaid
    ? `
    <div style="border:2px solid #111;border-radius:8px;padding:18px 20px;margin:24px 0">

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
        <tr>
          <td style="vertical-align:top">
            <p style="margin:0;font-size:18px;font-weight:bold;letter-spacing:1px">RECEIPT</p>
            <p style="margin:2px 0 0;font-size:12px;color:#555">
              Receipt No: ${escapeHtml(order.orderNumber || order._id)}
            </p>
          </td>
          <td align="right" style="vertical-align:top">
            <p style="margin:0;font-weight:bold">${escapeHtml(
              process.env.BUSINESS_NAME || "ONE18 Bakery",
            )}</p>
            ${
              process.env.BUSINESS_ADDRESS
                ? `<p style="margin:2px 0 0;font-size:12px;color:#555">${escapeHtml(
                    process.env.BUSINESS_ADDRESS,
                  )}</p>`
                : ""
            }
            ${
              process.env.BUSINESS_UEN
                ? `<p style="margin:2px 0 0;font-size:12px;color:#555">UEN: ${escapeHtml(
                    process.env.BUSINESS_UEN,
                  )}</p>`
                : ""
            }
            ${
              process.env.BUSINESS_PHONE
                ? `<p style="margin:2px 0 0;font-size:12px;color:#555">${escapeHtml(
                    process.env.BUSINESS_PHONE,
                  )}</p>`
                : ""
            }
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;border-top:1px solid #ddd">
        <tr>
          <td style="color:#555">Billed to</td>
          <td align="right">
            ${escapeHtml(order.customer?.firstName || "")} ${escapeHtml(
              order.customer?.lastName || "",
            )}
            ${
              order.customer?.company
                ? `<br/>${escapeHtml(order.customer.company)}`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="color:#555">Date paid</td>
          <td align="right">${paidOn}</td>
        </tr>
        <tr>
          <td style="color:#555">Payment method</td>
          <td align="right">${escapeHtml(
            order.creditedAccount || order.paymentMethod || "—",
          )}</td>
        </tr>
        ${
          order.transactionId
            ? `<tr>
                 <td style="color:#555">Reference</td>
                 <td align="right" style="font-family:monospace;font-size:12px">${escapeHtml(
                   order.transactionId,
                 )}</td>
               </tr>`
            : ""
        }
        <tr style="border-top:2px solid #111">
          <td style="font-size:16px;font-weight:bold;padding-top:10px">AMOUNT PAID</td>
          <td align="right" style="font-size:16px;font-weight:bold;padding-top:10px">
            SGD ${(Number(order.paidAmount ?? order.totalAmount) || 0).toFixed(2)}
          </td>
        </tr>
      </table>

      <p style="margin:12px 0 0;font-size:11px;color:#777">
        Paid in full. This receipt is computer generated and valid without a signature.
      </p>
    </div>`
    : "";

  return `
  <div style="font-family:Arial; max-width:700px; line-height:1.6">

    <h2>${isPaid ? "🧾 Order Confirmation &amp; Receipt" : "🧾 Order Confirmation"}</h2>

    <p><b>Order No:</b> ${order.orderNumber || order._id}</p>
    <p><b>Type:</b> ${order.fulfillmentType.toUpperCase()}</p>
    <p><b>Date:</b> ${order.fulfillmentDate}</p>
    <p><b>Time:</b> ${order.fulfillmentTime}</p>

    ${customerBlock}

    ${order.fulfillmentType === "delivery" ? deliveryBlock : pickupBlock}

    ${notesBlock}

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

    ${receiptBlock}

  </div>
  `;
};