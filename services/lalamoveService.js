import axios from "axios";
import { signLalamoveRequest } from "../utils/lalamoveSign.js";

const BASE = process.env.LALAMOVE_BASE_URL;
const API_KEY = process.env.LALAMOVE_API_KEY;
const MARKET = process.env.LALAMOVE_MARKET;

export async function createLalamoveOrder(order) {
  const path = `/v3/orders`;
  const method = "POST";

  const bodyObj = {
    data: {
      serviceType: "MOTORCYCLE",
      language: "en_SG",

      stops: [
        // ✅ PICKUP STOP
        {
          address: order.pickupLocation.address,
          name: order.pickupLocation.name,
          phone: process.env.BAKERY_PHONE,
        },

        // ✅ DELIVERY STOP
        {
          address: order.deliveryAddress.addressText,
          coordinates: {
            lat: order.deliveryAddress.lat,
            lng: order.deliveryAddress.lng,
          },
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: order.customer.phone,
        },
      ],

      specialRequests: [],
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

  const res = await axios.post(`${BASE}${path}`, bodyObj, {
    headers: {
      "Content-Type": "application/json",
      Market: MARKET,
      Authorization: `hmac ${API_KEY}:${timestamp}:${signature}`,
    },
  });

  return res.data;
}
