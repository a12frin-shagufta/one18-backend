import ExcelJS from "exceljs";
import Order from "../models/Order.js";

export const exportPaymentReport = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("branch", "name");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Payments");

    ws.columns = [
      { header: "Order ID", key: "id", width: 26 },
      { header: "Date", key: "date", width: 20 },
      { header: "Customer", key: "customer", width: 28 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Customer Address", key: "custAddress", width: 40 },
      { header: "Postal Code", key: "custPostal", width: 16 },

      { header: "Branch", key: "branch", width: 20 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Payment Method", key: "method", width: 16 },
      { header: "Payment Status", key: "status", width: 18 },
      { header: "Credited Account", key: "account", width: 20 },
      { header: "Transaction ID", key: "txn", width: 30 },
      { header: "Paid At", key: "paidAt", width: 22 },
    ];

    orders.forEach((o) => {
      ws.addRow({
       id: o.orderNumber || o._id.toString(),

        date: o.createdAt,
        customer: `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`,
        phone: o.customer?.phone || "",
        custAddress: o.deliveryAddress?.addressText || "",
        custPostal: o.deliveryAddress?.postalCode || "",

        branch: o.branch?.name || "",
        amount: o.totalAmount || 0,
        method: o.paymentMethod || "",
        status: o.paymentStatus || "",
        account: o.creditedAccount || "",
        txn: o.transactionId || "",
        paidAt: o.paidAt || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=payment-report.xlsx",
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
