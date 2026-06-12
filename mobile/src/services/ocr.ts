// On-device text recognition (Apple/MLKit via @react-native-ml-kit) for MRZ.
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { extractMrzLines } from '../utils/mrz';

export async function recognizeText(photoPath: string): Promise<string> {
  const uri = photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`;
  try {
    const result = await TextRecognition.recognize(uri);
    return result?.text ?? '';
  } catch {
    return '';
  }
}

/** Recognize text in a photo and return the MRZ block if one is present. */
export async function recognizeMrz(photoPath: string): Promise<string | null> {
  const text = await recognizeText(photoPath);
  return extractMrzLines(text);
}
