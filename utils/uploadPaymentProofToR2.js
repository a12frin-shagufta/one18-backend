import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import sharp from "sharp";
import { r2 } from "../config/r2.js";

export const uploadPaymentProofToR2 = async (file) => {
  // 🔒 Safety checks
  if (!file.mimetype.startsWith("image/")) {
    throw new Error("Only image files allowed");
  }

  const buffer = await sharp(file.buffer)
    .resize(1200)
    .jpeg({ quality: 75 })
    .toBuffer();

  const fileName = `payments/${crypto.randomBytes(16).toString("hex")}.jpg`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};
