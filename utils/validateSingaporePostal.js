import axios from "axios";

export async function validateSingaporePostal(postalCode) {
  try {
    if (!/^\d{6}$/.test(postalCode)) {
      return { valid: false };
    }

    const res = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: postalCode,
          components: "country:SG",
          region: "sg",
          key: process.env.GOOGLE_MAPS_API_KEY, // ✅ BACKEND KEY
        },
      }
    );

    // ❌ GOOGLE SAYS INVALID
    if (res.data.status !== "OK" || !res.data.results.length) {
      return { valid: false };
    }

    const components = res.data.results[0].address_components;

    const area =
      components.find(c => c.types.includes("sublocality_level_1"))?.long_name ||
      components.find(c => c.types.includes("neighborhood"))?.long_name ||
      components.find(c => c.types.includes("locality"))?.long_name ||
      components.find(c => c.types.includes("administrative_area_level_2"))?.long_name;

    // ❌ NO MEANINGFUL AREA → INVALID
    if (!area) {
      return { valid: false };
    }

    return {
      valid: true,
      area,
    };
  } catch (err) {
    console.error("Postal validation error:", err.message);
    return { valid: false };
  }
}
