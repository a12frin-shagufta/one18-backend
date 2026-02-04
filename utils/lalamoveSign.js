import crypto from "crypto";

export function signLalamoveRequest({
  method,
  path,
  body = "",
  timestamp,
}) {
  const apiSecret = process.env.LALAMOVE_API_SECRET;

  const raw = `${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${body}`;

  return crypto
    .createHmac("sha256", apiSecret)
    .update(raw)
    .digest("hex");
}
