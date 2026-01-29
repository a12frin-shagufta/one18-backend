import axios from "axios";

export async function validateSingaporePostal(postalCode) {
  if (!/^\d{6}$/.test(postalCode)) {
    return { valid: false };
  }

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address: postalCode,
        components: "country:SG",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    }
  );

  if (data.status !== "OK" || !data.results.length) {
    return { valid: false };
  }

  const result = data.results[0];

  // ✅ Extract area
  const area =
    result.address_components.find(c =>
      c.types.includes("neighborhood") ||
      c.types.includes("sublocality")
    )?.long_name ||
    result.address_components.find(c =>
      c.types.includes("locality")
    )?.long_name ||
    null;

  // ✅ Confirm country = SG
  const country = result.address_components.find(c =>
    c.types.includes("country")
  )?.short_name;

  if (country !== "SG") {
    return { valid: false };
  }

  return {
    valid: true,
    area,
    formattedAddress: result.formatted_address,
    location: result.geometry.location,
  };
}
