// BlinkID (Microblink) scanning — auto-detects DL vs passport, extracts the
// document data + the ID photo + a tamper (data-match) signal. We map the
// fields to the backend's structured-scan payload; the photo stays on-device.
import {
  performScan,
  BlinkIdSdkSettings,
  BlinkIdSessionSettings,
} from '@microblink/blinkid-react-native';
import { BLINKID_LICENSE_KEY } from '../blinkidLicense';
import type { StructuredScanPayload } from '../api/client';

export interface BlinkIdScan {
  payload: StructuredScanPayload;
  faceImage?: string; // data URI
}

function isoDate(d: any): string | undefined {
  const dt = d?.date;
  if (!dt?.year || !dt?.month || !dt?.day) return undefined;
  return `${dt.year}-${String(dt.month).padStart(2, '0')}-${String(dt.day).padStart(2, '0')}`;
}

function str(v: any): string | undefined {
  const s = v?.value ?? v;
  return typeof s === 'string' && s.trim() ? s.trim() : undefined;
}

function mapDocType(result: any): string {
  const t = String(result?.documentClassInfo?.documentType ?? '').toLowerCase();
  const country = String(result?.documentClassInfo?.country ?? '').toLowerCase();
  if (t.includes('passport')) return country.includes('united states') ? 'US_PASSPORT' : 'INTERNATIONAL_PASSPORT';
  if (t.includes('military')) return 'MILITARY_ID';
  if (t === 'id' || t.includes('resident') || t.includes('consular')) return 'US_STATE_ID';
  return 'US_DRIVERS_LICENSE';
}

function dataMatch(result: any): boolean | undefined {
  const s = result?.dataMatchResult?.overallState;
  if (s === 2) return true;   // Success
  if (s === 1) return false;  // Failed
  return undefined;           // NotPerformed
}

export async function scanWithBlinkId(): Promise<BlinkIdScan | null> {
  const sdk = new BlinkIdSdkSettings(BLINKID_LICENSE_KEY);
  const session = new BlinkIdSessionSettings();
  session.scanningSettings.croppedImageSettings.returnFaceImage = true;

  const result: any = await performScan(sdk, session);
  if (!result) return null;

  const payload: StructuredScanPayload = {
    document_type: mapDocType(result),
    first_name: str(result.firstName),
    last_name: str(result.lastName),
    date_of_birth: isoDate(result.dateOfBirth),
    expiration_date: isoDate(result.dateOfExpiry),
    sex: str(result.sex),
    document_number: str(result.documentNumber),
    address_state: str(result.stateCode) ?? str(result.documentClassInfo?.region),
    nationality: str(result.nationality),
    data_match: dataMatch(result),
    scan_method: 'camera',
  };

  const img = result.faceImage?.image;
  const faceImage = typeof img === 'string' && img.length ? `data:image/jpeg;base64,${img}` : undefined;

  return { payload, faceImage };
}
