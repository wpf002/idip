// Input validation helpers used on the Setup and PIN screens.
export function isValidPin(pin: string): boolean {
  return /^[0-9]{4}$/.test(pin);
}

export function isValidApiUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidApiKey(key: string): boolean {
  return typeof key === 'string' && key.trim().length >= 8;
}

export function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}
