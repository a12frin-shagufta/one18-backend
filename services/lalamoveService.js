import axios from "axios";
import { signLalamoveRequest } from "../utils/lalamoveSign.js";
import moment from "moment-timezone";
const SG_TZ = "Asia/Singapore";

const BASE = process.env.LALAMOVE_BASE_URL;
const API_KEY = process.env.LALAMOVE_API_KEY;
const MARKET = process.env.LALAMOVE_MARKET;

async function signAndCall(path, method, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const timestamp = Date.now().toString();

  const signature = signLalamoveRequest({
    method,
    path,
    body,
    timestamp,
  });

  console.log("📡 Lalamove CALL →", method, path);  
 console.log("📡 Lalamove BODY →", JSON.stringify(bodyObj, null, 2));

  try {
        const res = await axios.post(`${BASE}${path}`, body, {
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

  const quotePath = "/v3/quotations";

  const scheduleAt = moment
  .tz(
    `${order.fulfillmentDate} ${order.fulfillmentTime}`,
    "YYYY-MM-DD HH:mm",
    SG_TZ
  )
  .toISOString();

  const quoteBody = {
  data: {
    scheduleAt,
    serviceType: "MOTORCYCLE",
    language: "en_SG",
    isRouteOptimized: false,

    item: {
      quantity: 1,
      weight: 1,
      categories: ["FOOD"],
    },

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
