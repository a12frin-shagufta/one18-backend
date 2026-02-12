import QRCode from "qrcode";
import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

const len2 = (v) => String(v.length).padStart(2, "0");

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000)
        ? (crc << 1) ^ 0x1021
        : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

router.get("/qr/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const amount = Number(order.totalAmount).toFixed(2);
    const uen = process.env.PAYNOW_UEN;

    const paynowApp = "SG.PAYNOW";

    const merchant =
      "00" + len2(paynowApp) + paynowApp +
      "01" + len2(uen) + uen;

    const name = "ONE18 BAKERY";
    const city = "SINGAPORE";

    const ref = `ORD${order._id.toString().slice(-6)}`; // short ref

const additional =
  "05" + len2(ref) + ref;   // tag 05 = bill reference

let payload =
  "000201" +                 // payload format
  "010212" +                 // dynamic QR
  `26${len2(merchant)}${merchant}` +
  "52040000" +               // MCC
  "5303702" +                // SGD
  `54${len2(amount)}${amount}` +
  "5802SG" +
  `59${len2(name)}${name}` +
  `60${len2(city)}${city}` +
  `62${len2(additional)}${additional}` +
  "6304";
    const crc = crc16(payload);
    payload += crc;

    const qr = await QRCode.toDataURL(payload);

    res.json({
      qr,
      amount,
      reference: `ORDER_${order._id}`,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
