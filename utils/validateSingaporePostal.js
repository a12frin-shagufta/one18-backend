import axios from "axios";

export function validateSingaporePostal(postalCode) {
  if (!/^\d{6}$/.test(postalCode)) {
    return { valid: false };
  }

  const prefix = postalCode.slice(0, 2);

  let area = "Singapore";

  // Optional: basic area mapping
  if (["52","53","54","55"].includes(prefix)) area = "Tampines";
  else if (["67","68","69"].includes(prefix)) area = "Woodlands";
  else if (["18","19"].includes(prefix)) area = "Bugis";
  else if (["23","24"].includes(prefix)) area = "Orchard";

  return {
    valid: true,
    area,
  };
}