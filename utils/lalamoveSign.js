import crypto from "crypto";

export function signLalamoveRequest({ method, path, body, timestamp }) {
const secret = process.env.LALAMOVE_API_SECRET;


  const rawSignature =
    `${timestamp}\r\n` +
    `${method.toUpperCase()}\r\n` +
    `${path}\r\n\r\n` +
    (body || "");

  console.log("🔐 SIGN RAW =", rawSignature);

  return crypto
    .createHmac("sha256", secret)
    .update(rawSignature)
    .digest("hex");
}
