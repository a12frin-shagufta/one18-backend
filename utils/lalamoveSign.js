import crypto from "crypto";

const SECRET = process.env.LALAMOVE_API_SECRET;

export function signLalamoveRequest({ method, path, body, timestamp }) {
  if (!SECRET) {
    throw new Error("LALAMOVE_API_SECRET missing");
  }

  const raw = `${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${body}`;

  console.log("🔥 REAL SIGN STRING 🔥");
  console.log(raw);

  return crypto
    .createHmac("sha256", SECRET)
    .update(raw)
    .digest("hex");
}
