// Centre operates in IST (Gurugram). Use these helpers for booking dates so
// "today" matches the centre regardless of the patient's browser timezone.

const TZ = 'Asia/Kolkata';

const idFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

/** YYYY-MM-DD for a given instant in IST. */
export function istDateString(date = new Date()) {
  return idFmt.format(date);
}

/** Next N calendar days starting from today (IST). */
export function nextCentreDays(count = 7) {
  const out = [];
  const today = istDateString();
  const [y, m, d] = today.split('-').map(Number);
  for (let i = 0; i < count; i++) {
    // Noon IST avoids DST edge cases (India has no DST, but keeps logic stable).
    const anchor = new Date(Date.UTC(y, m - 1, d + i, 6, 30, 0));
    const id = idFmt.format(anchor);
    const dow = anchor.toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short' }).toUpperCase();
    const day = anchor.toLocaleDateString('en-IN', { timeZone: TZ, day: 'numeric' });
    const mon = anchor.toLocaleDateString('en-IN', { timeZone: TZ, month: 'short' });
    out.push({ id, dow, day: Number(day), mon });
  }
  return out;
}
