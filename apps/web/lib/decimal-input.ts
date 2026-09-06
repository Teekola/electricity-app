/** Normalizes commas to dots, strips non-numeric characters, and keeps only one decimal point. */
export function sanitizeDecimalInput(value: string, maxDecimals?: number): string {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.-]/g, "");
  // An average price goes below zero, so a leading minus belongs to a bound. Anywhere else it does not.
  const sign = normalized.startsWith("-") ? "-" : "";
  const [integerPart = "", ...decimalParts] = normalized.replaceAll("-", "").split(".");

  if (decimalParts.length === 0 || maxDecimals === 0) return `${sign}${integerPart}`;

  const decimals = decimalParts.join("");

  return `${sign}${integerPart}.${maxDecimals === undefined ? decimals : decimals.slice(0, maxDecimals)}`;
}
