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
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (res.data.status !== "OK" || !res.data.results.length) {
      return { valid: false };
    }

    const result = res.data.results[0];

    const components = result.address_components;

    const area =
      components.find(c => c.types.includes("sublocality_level_1"))?.long_name ||
      components.find(c => c.types.includes("neighborhood"))?.long_name ||
      components.find(c => c.types.includes("locality"))?.long_name ||
      components.find(c => c.types.includes("administrative_area_level_2"))?.long_name;

    if (!area) {
      return { valid: false };
    }

    // ✅ ADD THIS
    const lat = result.geometry.location.lat;
    const lng = result.geometry.location.lng;

    return {
      valid: true,
      area,
      lat,
      lng,
      formattedAddress: result.formatted_address,
    };

  } catch (err) {
    console.error("Postal validation error:", err.message);
    return { valid: false };
  }
}
