// Pure-JS crypto helpers (crypto-js works in both React Native and Node/Jest).
import sha256 from 'crypto-js/sha256';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

export function sha256Hex(value: string): string {
  return sha256(value).toString(Hex);
}

export function hmacHex(value: string, secret: string): string {
  return hmacSHA256(value, secret).toString(Hex);
}

/** PIN is SHA-256 hashed before being stored in the Keychain. */
export function hashPin(pin: string): string {
  return sha256Hex(pin);
}

/** Stable hash of an offline-queue payload for dedupe / integrity. */
export function hashPayload(payload: object, secret: string): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return hmacHex(canonical, secret);
}
