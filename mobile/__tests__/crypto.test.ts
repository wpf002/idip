import { sha256Hex, hmacHex, hashPin, hashPayload } from '../src/utils/crypto';

describe('crypto utils', () => {
  test('sha256Hex is deterministic and 64 hex chars', () => {
    const a = sha256Hex('hello');
    const b = sha256Hex('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  test('sha256Hex differs for different input', () => {
    expect(sha256Hex('1234')).not.toBe(sha256Hex('1235'));
  });

  test('hashPin produces a 64-char hex digest', () => {
    expect(hashPin('4821')).toMatch(/^[0-9a-f]{64}$/);
  });

  test('hmacHex depends on the secret', () => {
    expect(hmacHex('payload', 'secretA')).not.toBe(hmacHex('payload', 'secretB'));
  });

  test('hashPayload is stable regardless of key order', () => {
    const h1 = hashPayload({ a: 1, b: 2 }, 'k');
    const h2 = hashPayload({ b: 2, a: 1 }, 'k');
    expect(h1).toBe(h2);
  });
});
