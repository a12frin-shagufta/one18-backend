export const FAR_PREFIXES = [
  // EAST
  "46","47","48","49","50","51","52","53","54","55","56","57",

  // FAR NORTH / WEST
  "60","61","62","63","64","65","66","67","68","69",
  "70","71","72","73","74","75","76","77","78","79"
];


export function calculateDeliveryFee({ postalCode, subtotal }) {
  if (!postalCode) return null;

  if (subtotal >= 180) return 0;

  const prefix = postalCode.slice(0, 2);
  return FAR_PREFIXES.includes(prefix) ? 15 : 10;
}
