import express from "express";
import axios from "axios";
import Branch from "../models/Branch.js";

const router = express.Router();

// ✅ Haversine distance formula (KM)
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ OneMap postal -> address + lat/lng
async function getOneMapLocation(postalCode) {
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

  const res = await axios.get(url);
  const results = res.data?.results || [];

  const match = results.find((r) => r.POSTAL === postalCode);

  if (!match) return null;

  return {
    postalCode: match.POSTAL,
    address: match.ADDRESS,
    lat: Number(match.LATITUDE),
    lng: Number(match.LONGITUDE),
  };
}

// ✅ POST /api/delivery/check
router.post("/check", async (req, res) => {
  try {
    const { postalCode, subtotal, branchId } = req.body;

    // ✅ Required
    if (!postalCode) {
      return res.status(400).json({ message: "Postal code required" });
    }

    const cleanPostal = String(postalCode).trim();

    // ✅ Singapore format check
    if (!/^\d{6}$/.test(cleanPostal)) {
      return res.status(400).json({ message: "Postal code must be 6 digits" });
    }

    const sub = Number(subtotal || 0);

    // ✅ Free delivery example
    if (sub >= 180) {
      return res.json({
        eligible: true,
        deliveryFee: 0,
        distanceKm: 0,
        address: "Free delivery (subtotal rule)",
      });
    }

    // ✅ Validate postal from OneMap
    const customerLoc = await getOneMapLocation(cleanPostal);

    if (!customerLoc) {
      return res.status(400).json({
        message: "Invalid postal code (not found in Singapore)",
      });
    }

    // ✅ Get branch location
    let branch = null;

    if (branchId) {
      branch = await Branch.findById(branchId);
    }

    if (!branch) {
      branch = await Branch.findOne();
    }

    if (!branch) {
      return res.status(400).json({ message: "No branch found" });
    }

    // ✅ You MUST have branch.location.lat + branch.location.lng
    const branchLat = branch.location?.lat;
    const branchLng = branch.location?.lng;

    if (!branchLat || !branchLng) {
      return res.status(400).json({
        message: "Branch location missing (lat/lng not set)",
      });
    }

    // ✅ Distance calculation
    const distanceKm = haversineKm(
      branchLat,
      branchLng,
      customerLoc.lat,
      customerLoc.lng
    );

    // ✅ Your rule
    // <= 10km => $10
    // > 10km => $15
    const deliveryFee = distanceKm > 10 ? 15 : 10;

    return res.json({
      eligible: true,
      deliveryFee,
      distanceKm: Number(distanceKm.toFixed(2)),
      address: customerLoc.address,
      postalCode: customerLoc.postalCode,
    });
  } catch (err) {
    console.error("DELIVERY CHECK ERROR:", err.message);
    return res.status(500).json({ message: "Delivery check failed" });
  }
});

export default router;
