import { extractMrzLines, looksLikeMrz } from '../src/utils/mrz';

const TD3_L1 = 'P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';
const TD3_L2 = '1234567897USA9001157M3501157<<<<<<<<<<<<<<00';

describe('MRZ extraction from OCR text', () => {
  test('pulls the two TD3 lines out of noisy OCR output', () => {
    const ocr = [
      'UNITED STATES OF AMERICA',
      'PASSPORT',
      'Surname DOE',
      TD3_L1,
      TD3_L2,
    ].join('\n');
    expect(extractMrzLines(ocr)).toBe(`${TD3_L1}\n${TD3_L2}`);
  });

  test('handles stray spaces inside MRZ lines', () => {
    const ocr = `${TD3_L1.slice(0, 20)} ${TD3_L1.slice(20)}\n${TD3_L2}`;
    expect(extractMrzLines(ocr)).toBe(`${TD3_L1}\n${TD3_L2}`);
  });

  test('returns null when there is no MRZ', () => {
    expect(extractMrzLines('JUST SOME\nRANDOM TEXT')).toBeNull();
    expect(looksLikeMrz('hello world')).toBe(false);
  });

  test('looksLikeMrz is true for a valid block', () => {
    expect(looksLikeMrz(`${TD3_L1}\n${TD3_L2}`)).toBe(true);
  });
});
