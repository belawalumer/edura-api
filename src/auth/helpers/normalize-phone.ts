export function toNullablePhone(phone?: string | null): string | null {
  if (phone == null) return null;
  const phoneStr = String(phone).trim();
  return phoneStr.length > 0 ? phoneStr : null;
}
