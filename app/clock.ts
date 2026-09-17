/* One authoritative clock arithmetic — pure helpers the identity
   clock derives its display values from the REAL current time.
   Animation state is never the source of a displayed number, and
   English/Bengali share this single path (localization happens only
   at render, via localizeDigits). Unit-tested in scripts/check-units
   across the dial boundaries: 00→12, 11:59→12:00, 12:59→01:00,
   23→11, and the 55→56→…→59→00 second sequence. */

/** 24-hour value → 12-hour dial number: 0→12, 13→1, 23→11. */
export function hour12(h24: number): number {
  const h = Number.isFinite(h24) ? Math.trunc(h24) : 0;
  return ((((h % 24) + 24 + 11) % 12) + 1);
}

/** Zero-padded two-digit clock part, clamped to the valid 0–59 range. */
export function twoDigit(n: number): string {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  return String(Math.min(59, Math.max(0, v))).padStart(2, '0');
}
