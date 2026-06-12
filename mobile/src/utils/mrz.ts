// Pure helper: extract the Machine Readable Zone lines from noisy OCR output.
// The backend's mrz_parser does the actual ICAO 9303 parsing + check digits;
// this just isolates the candidate MRZ lines and normalizes them.

const MRZ_CHARS = /^[A-Z0-9<]+$/;

function normalize(line: string): string {
  return line.replace(/\s+/g, '').toUpperCase();
}

function isMrzLine(line: string): boolean {
  return (
    MRZ_CHARS.test(line) &&
    line.includes('<') &&
    line.length >= 28 &&
    line.length <= 46
  );
}

/**
 * Returns the MRZ block (lines joined by "\n") ready to send to the backend, or
 * null if no plausible MRZ was found. Handles TD3 (2x44, passports) and
 * TD1 (3x30, ID/passport cards).
 */
export function extractMrzLines(ocrText: string): string | null {
  const candidates = (ocrText || '')
    .split(/\r?\n/)
    .map(normalize)
    .filter(isMrzLine);

  if (candidates.length < 2) return null;

  // TD3 — passport: two lines ~44 chars.
  const td3 = candidates.filter((l) => l.length >= 40);
  if (td3.length >= 2) return td3.slice(-2).join('\n');

  // TD1 — ID / passport card: three lines ~30 chars.
  const td1 = candidates.filter((l) => l.length >= 28 && l.length <= 32);
  if (td1.length >= 3) return td1.slice(-3).join('\n');

  // Fallback: last two candidate lines.
  return candidates.slice(-2).join('\n');
}

/** Quick check used by the camera loop to decide whether to stop scanning. */
export function looksLikeMrz(ocrText: string): boolean {
  return extractMrzLines(ocrText) !== null;
}
