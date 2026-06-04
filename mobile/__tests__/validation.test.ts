import {
  isValidPin,
  isValidApiUrl,
  isValidApiKey,
  normalizeApiUrl,
} from '../src/utils/validation';

describe('validation helpers', () => {
  test('isValidPin requires exactly 4 digits', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  test('isValidApiUrl accepts http(s) URLs', () => {
    expect(isValidApiUrl('https://api.example.com')).toBe(true);
    expect(isValidApiUrl('http://localhost:8080')).toBe(true);
    expect(isValidApiUrl('not a url')).toBe(false);
    expect(isValidApiUrl('')).toBe(false);
  });

  test('isValidApiKey requires a minimum length', () => {
    expect(isValidApiKey('idip_abcdefgh')).toBe(true);
    expect(isValidApiKey('short')).toBe(false);
  });

  test('normalizeApiUrl trims trailing slashes and whitespace', () => {
    expect(normalizeApiUrl('  https://api.example.com/// ')).toBe(
      'https://api.example.com',
    );
  });
});
