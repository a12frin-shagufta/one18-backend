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
      serviceType: "MOTORCYCLE", // can change later
      specialRequests: [],
      stops: [
        {
          address: order.pickupLocation.address,
          name: order.pickupLocation.name,
        },
        {
          address: order.deliveryAddress.addressText,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: order.customer.phone,
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

  const res = await axios.post(`${BASE}${path}`, bodyObj, {
    headers: {
      "Content-Type": "application/json",
      "Market": MARKET,
      "Authorization": `hmac ${API_KEY}:${timestamp}:${signature}`,
    },
  });

  return res.data;
}
