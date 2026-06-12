// Pick a profile photo from the library and return a compact data URI.
import { launchImageLibrary } from 'react-native-image-picker';

export async function pickProfilePhoto(): Promise<string | null> {
  const res = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.7,
    selectionLimit: 1,
  });
  if (res.didCancel || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (asset.base64) {
    return `data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`;
  }
  return asset.uri ?? null;
}
