export function normalizePartNumber(value) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().replace(/[\s-]+/gu, "");
}
