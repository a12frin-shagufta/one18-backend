import axios from "axios";
import { signLalamoveRequest } from "../utils/lalamoveSign.js";
import moment from "moment-timezone";


const BASE = process.env.LALAMOVE_BASE_URL;
const API_KEY = process.env.LALAMOVE_API_KEY;
const MARKET = process.env.LALAMOVE_MARKET;

const SG_TZ = "Asia/Singapore";

const fulfillmentDateTimeSG = moment.tz(
  `${order.fulfillmentDate} ${order.fulfillmentTime}`,
  "YYYY-MM-DD HH:mm",
  SG_TZ
);

if (!fulfillmentDateTimeSG.isValid()) {
  throw new Error("Invalid fulfillment datetime");
}

const scheduleAt = fulfillmentDateTimeSG.utc().toISOString();


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

  const SG_TZ = "Asia/Singapore";

  const fulfillmentDateTimeSG = moment.tz(
    `${order.fulfillmentDate} ${order.fulfillmentTime}`,
    "YYYY-MM-DD HH:mm",
    SG_TZ
  );

  if (!fulfillmentDateTimeSG.isValid()) {
    throw new Error("Invalid fulfillment datetime");
  }

  const scheduleAt = fulfillmentDateTimeSG.utc().toISOString();

  const stops = [
    {
      stopId: "1",
      address: order.pickupLocation.address,
      name: order.pickupLocation.name,
      phone: process.env.BAKERY_PHONE,
      coordinates: {
        lat: Number(order.pickupLocation.lat || 1.3521),
        lng: Number(order.pickupLocation.lng || 103.8198),
      },
    },
    {
      stopId: "2",
      address: order.deliveryAddress.addressText,
      name: `${order.customer.firstName} ${order.customer.lastName}`,
      phone: order.customer.phone.startsWith("+")
        ? order.customer.phone
        : `+65${order.customer.phone}`,
      coordinates: {
        lat: Number(order.deliveryAddress.lat),
        lng: Number(order.deliveryAddress.lng),
      },
    },
  ];

  const quoteBody = {
    data: {
      scheduleAt,
      serviceType: "MOTORCYCLE_SG",
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
