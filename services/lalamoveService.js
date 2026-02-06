import axios from "axios";
import { signLalamoveRequest } from "../utils/lalamoveSign.js";
import moment from "moment-timezone";
const SG_TZ = "Asia/Singapore";


const BASE = process.env.LALAMOVE_BASE_URL;
const API_KEY = process.env.LALAMOVE_API_KEY;
const MARKET = process.env.LALAMOVE_MARKET;
console.log("🌍 LALAMOVE CONFIG →", {
  BASE,
  MARKET,
  KEY: API_KEY?.slice(0, 10) + "...",
});


async function signAndCall(path, method, bodyObj) {
  const bodyString = JSON.stringify(bodyObj); // ✅ FOR SIGNATURE
  const timestamp = Date.now().toString();

  const signature = signLalamoveRequest({
    method,
    path,
    body: bodyString, // ✅ string here
    timestamp,
  });
  
  console.log("🔐 SIGNATURE =", signature);

  console.log("📡 Lalamove CALL →", method, path);
  console.log("📡 Lalamove BODY →", bodyString);

console.log("POSTMAN_AUTH_HEADER =",
  `hmac ${API_KEY}:${timestamp}:${signature}`
);


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

const scheduleAt = moment().add(2, "hours").toISOString();
  // ← USE THIS


const minTime = moment().tz(SG_TZ).add(30, "minutes");

if (moment(scheduleAt).isBefore(minTime)) {
  throw new Error("Delivery time too soon for Lalamove");
}


  if (!/^\+65\d{8}$/.test(order.customer.phone)) {
  throw new Error("Invalid customer phone for Lalamove");
}


  const stops = [
  {
    stopId: "STP_001",
    address: order.pickupLocation.address,
    coordinates: {
      lat: Number(order.pickupLocation.lat),
      lng: Number(order.pickupLocation.lng),
    },
    contact: {
      name: order.pickupLocation.name,
      phone: process.env.BAKERY_PHONE,
    },
  },
  {
    stopId: "STP_002",
    address: order.deliveryAddress.addressText,
    coordinates: {
      lat: Number(order.deliveryAddress.lat),
      lng: Number(order.deliveryAddress.lng),
    },
    contact: {
      name: `${order.customer.firstName} ${order.customer.lastName}`,
      phone: order.customer.phone,
    },
  },
];


console.log("📞 BAKERY_PHONE =", process.env.BAKERY_PHONE);
console.log("🛑 STOPS PAYLOAD:", JSON.stringify(stops, null, 2));

if (!order.pickupLocation.lat || !order.pickupLocation.lng) {
  throw new Error("Pickup coordinates required from branch");
}

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
    scheduleAt,   // ✅ ADD THIS BACK
    serviceType: "VAN",
    language: "en_SG",
    isRouteOptimized: false,

    requesterContact: {
      name: "Bakery",
      phone: process.env.BAKERY_PHONE
    },

    stops,

    items: [
      {
        quantity: "1",
        description: "Food",
        categories: ["FOOD"],
        weight: {
          value: "1",
          unit: "KG"
        }
      }
    ]
  }
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
