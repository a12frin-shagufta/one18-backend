import crypto from "crypto";

export function signLalamoveRequest({ method, path, body, timestamp }) {
  const secret = process.env.LALAMOVE_API_SECRET;

  if (!secret) {
    throw new Error("LALAMOVE_API_SECRET missing");
  }

  const raw =
`${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${body || ""}`;

  console.log("🔥 NEW SIGN FORMAT 🔥");
  console.log(raw);

  return crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");
}
