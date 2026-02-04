import axios from "axios";
import { signLalamoveRequest } from "../utils/lalamoveSign.js";

const BASE = process.env.LALAMOVE_BASE_URL;
const API_KEY = process.env.LALAMOVE_API_KEY;
const MARKET = process.env.LALAMOVE_MARKET;

export async function createLalamoveOrder(order) {
  const path = `/v3/orders`;
  const method = "POST";

  if (!order.pickupLocation || !order.deliveryAddress) {
    throw new Error("Missing pickup or delivery data");
  }

  const bodyObj = {
    data: {
      serviceType: "MOTORCYCLE",
      language: "en_SG",
      specialRequests: [],

      stops: [
        // ✅ PICKUP
        {
          address: order.pickupLocation.address,
          name: order.pickupLocation.name,
          phone: process.env.BAKERY_PHONE || order.customer.phone,
          coordinates: {
            lat: order.pickupLocation.lat || 1.3521,
            lng: order.pickupLocation.lng || 103.8198,
          },
        },

        // ✅ DROP
        {
          address: order.deliveryAddress.addressText,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: order.customer.phone,
          coordinates: {
            lat: order.deliveryAddress.lat,
            lng: order.deliveryAddress.lng,
          },
        },
      ],
    },
  };

  const body = JSON.stringify(bodyObj);
  const timestamp = Date.now().toString();

  const signature = signLalamoveRequest({
    method,
    path,
    body,
    timestamp,
  });

  console.log("========== LALAMOVE DEBUG ==========");
  console.log("BASE:", BASE);
  console.log("MARKET:", MARKET);
  console.log("BODY:", JSON.stringify(bodyObj, null, 2));
  console.log("====================================");

  try {
    const res = await axios.post(`${BASE}${path}`, body, {
      headers: {
        "Content-Type": "application/json",
        Market: MARKET,
        Authorization: `hmac ${API_KEY}:${timestamp}:${signature}`,
      },
    });

    console.log("✅ Lalamove SUCCESS:", res.data);
    return res.data;

  } catch (err) {
    console.log("❌ Lalamove AXIOS ERROR");
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);
    throw err;
  }
}
