import axios from "axios";
import { signLalamoveRequest } from "../utils/lalamoveSign.js";
import moment from "moment-timezone";
const SG_TZ = "Asia/Singapore";

const BASE = process.env.LALAMOVE_BASE_URL;
const API_KEY = process.env.LALAMOVE_API_KEY;
const MARKET = process.env.LALAMOVE_MARKET;

async function signAndCall(path, method, bodyObj) {
  const bodyString = JSON.stringify(bodyObj); // ✅ FOR SIGNATURE
  const timestamp = Date.now().toString();

  const signature = signLalamoveRequest({
    method,
    path,
    body: bodyString, // ✅ string here
    timestamp,
  });

  console.log("📡 Lalamove CALL →", method, path);
  console.log("📡 Lalamove BODY →", bodyString);

  try {
    const res = await axios.post(`${BASE}${path}`, bodyObj, { // ✅ object here
      headers: {
        "Content-Type": "application/json",
        Market: MARKET,
        Authorization: `hmac ${API_KEY}:${timestamp}:${signature}`,
      },
    });

    console.log("✅ Lalamove RESPONSE →", res.data);
    return res;

  } catch (err) {
    console.log("❌ Lalamove ERROR STATUS →", err.response?.status);
    console.log("❌ Lalamove ERROR DATA →", err.response?.data);
    throw err;
  }
}


export async function createLalamoveOrder(order) {
  if (!order.pickupLocation || !order.deliveryAddress) {
    throw new Error("Missing pickup or delivery data");
  }

  if (!order.deliveryAddress.lat || !order.deliveryAddress.lng) {
    throw new Error("Delivery coordinates missing");
  }

  const scheduleAt = moment
    .tz(
      `${order.fulfillmentDate} ${order.fulfillmentTime}`,
      "YYYY-MM-DD HH:mm",
      SG_TZ
    )
   .format("YYYY-MM-DDTHH:mm:ssZ")


const minTime = moment().tz(SG_TZ).add(30, "minutes");

if (moment(scheduleAt).isBefore(minTime)) {
  throw new Error("Delivery time too soon for Lalamove");
}


  if (!/^\+65\d{8}$/.test(order.customer.phone)) {
  throw new Error("Invalid customer phone for Lalamove");
}


  const stops = [
  {
    stopId: "PICKUP",
    address: order.pickupLocation.address,
    name: order.pickupLocation.name,
    phone: process.env.BAKERY_PHONE,
    coordinates: {
      lat: order.pickupLocation.lat || 1.3521,
      lng: order.pickupLocation.lng || 103.8198,
    },
  },
  {
    stopId: "DROP",
    address: order.deliveryAddress.addressText,
    name: `${order.customer.firstName} ${order.customer.lastName}`,
    phone: order.customer.phone.startsWith("+")
      ? order.customer.phone
      : `+${order.customer.phone}`,
    coordinates: {
      lat: order.deliveryAddress.lat,
      lng: order.deliveryAddress.lng,
    },
  },
];


  /* =========================
     STEP 1 — QUOTATION
  ========================== */

  /* =========================
   STEP 1 — QUOTATION
========================= */

const quotePath = "/v3/quotations";

/* ✅ DEFINE FIRST */


/* ✅ THEN USE */
const quoteBody = {
  data: {
    scheduleAt,
    serviceType: "MOTORCYCLE",
    language: "en_SG",
    isRouteOptimized: false,

    items: [
  {
    quantity: 1,
    weight: 1,
    categories: ["FOOD"],
  }
],



    stops,
  },
};




  console.log("📦 QUOTE BODY =", quoteBody);

  const quoteRes = await signAndCall(quotePath, "POST", quoteBody);

  const quotationId = quoteRes.data.data.quotationId;

  if (!quotationId) {
    throw new Error("Quotation failed");
  }

  console.log("✅ QUOTE OK:", quotationId);

  /* =========================
     STEP 2 — CREATE ORDER
  ========================== */

  const orderPath = "/v3/orders";

  const orderBody = {
    data: {
      quotationId,
    },
  };

  const orderRes = await signAndCall(orderPath, "POST", orderBody);

  console.log("🚚 LALAMOVE ORDER OK:", orderRes.data);

  return orderRes.data;
}
