// Indian mobile helpers — centre is in Gurugram; patients enter 10 digits only.

/** Strip stored E.164 / formatted value to 10 local digits for the input. */
export function toLocalDigits(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) return digits.slice(2, 12);
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/** 10-digit local number → +91XXXXXXXXXX for the API. */
export function toE164(local) {
  const digits = toLocalDigits(local);
  return digits ? `+91${digits}` : '';
}

/** Valid Indian mobile: 10 digits starting with 6–9. */
export function isValidIndianMobile(local) {
  return /^[6-9]\d{9}$/.test(toLocalDigits(local));
}

/** Display-friendly spacing: 98765 43210 */
export function formatLocalDisplay(local) {
  const d = toLocalDigits(local);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}
