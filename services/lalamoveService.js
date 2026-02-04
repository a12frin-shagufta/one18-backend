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

  if (
    !order.deliveryAddress?.lat ||
    !order.deliveryAddress?.lng
  ) {
    console.error("❌ Missing delivery coordinates:", order.deliveryAddress);
    throw new Error("Delivery coordinates missing — cannot book Lalamove");
  }

  const formatPhone = (p) =>
    p?.startsWith("+") ? p : `+${p}`;

  const bodyObj = {
    data: {
      serviceType: "MOTORCYCLE_SG",
      language: "en_SG",
      specialRequests: [],

      stops: [
        {
          address: order.pickupLocation.address,
          name: order.pickupLocation.name,
          phone: formatPhone(
            process.env.BAKERY_PHONE || order.customer.phone
          ),
          coordinates: {
            lat: order.pickupLocation.lat || 1.3521,
            lng: order.pickupLocation.lng || 103.8198,
          },
        },

        {
          address: order.deliveryAddress.addressText,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: formatPhone(order.customer.phone),
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

  console.log("🚚 LALAMOVE BODY =", JSON.stringify(bodyObj, null, 2));

  const res = await axios.post(`${BASE}${path}`, body, {
    headers: {
      "Content-Type": "application/json",
      Market: MARKET,
      Authorization: `hmac ${API_KEY}:${timestamp}:${signature}`,
    },
  });

  console.log("✅ Lalamove SUCCESS:", res.data);
  return res.data;
}

