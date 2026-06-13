// BlinkID (Microblink) scanning, tuned for door speed.
//
// Driver's licenses: barcode-only. We read just the PDF417 on the back, which
// carries the full AAMVA record (name, DOB, expiry, address, height, eye, hair,
// doc number) — a sub-second, single-capture scan with no card flip. The
// barcode is checksum-protected, so dropping the image quality gates can't
// produce a misread; it just lets BlinkID accept the first decodable frame.
// (Trade-off: barcodes hold no photo, so there's no face image for licenses.)
//
// Passports: single data-page scan, which keeps the face and the MRZ in one
// capture. Either way the fields map to the backend's structured-scan payload.
import {
  performScan,
  BlinkIdSdkSettings,
  BlinkIdSessionSettings,
  ScanningMode,
} from '@microblink/blinkid-react-native';
import { BLINKID_LICENSE_KEY } from '../blinkidLicense';
import type { StructuredScanPayload } from '../api/client';
import type { ScanMode } from '../screens/ScanHomeScreen';

export interface BlinkIdScan {
  payload: StructuredScanPayload;
  faceImage?: string; // data URI (passports only — DL barcode has no photo)
}

function isoDate(d: any): string | undefined {
  const dt = d?.date ?? d;
  if (!dt?.year || !dt?.month || !dt?.day) return undefined;
  return `${dt.year}-${String(dt.month).padStart(2, '0')}-${String(dt.day).padStart(2, '0')}`;
}

// Accepts both StringResult ({value}) and the barcode's plain-string fields.
function str(v: any): string | undefined {
  const s = v?.value ?? v;
  return typeof s === 'string' && s.trim() ? s.trim() : undefined;
}

function mapDocType(result: any, mode: ScanMode): string {
  const country = String(result?.documentClassInfo?.country ?? '').toLowerCase();
  if (mode === 'PASSPORT') {
    return country.includes('united states') ? 'US_PASSPORT' : 'INTERNATIONAL_PASSPORT';
  }
  const t = String(result?.documentClassInfo?.documentType ?? '').toLowerCase();
  if (t.includes('military')) return 'MILITARY_ID';
  if (t === 'id' || t.includes('identity') || t.includes('resident') || t.includes('consular')) return 'US_STATE_ID';
  return 'US_DRIVERS_LICENSE';
}

function dataMatch(result: any): boolean | undefined {
  const s = result?.dataMatchResult?.overallState;
  if (s === 2) return true; // Success
  if (s === 1) return false; // Failed
  return undefined; // NotPerformed (expected on single-side scans)
}

// The parsed AAMVA barcode (BarcodeResult) from the back of a US license.
function barcodeSub(result: any): any {
  return (result?.subResults ?? []).find((s: any) => s?.barcode)?.barcode ?? null;
}

export async function scanWithBlinkId(mode: ScanMode = 'DL'): Promise<BlinkIdScan | null> {
  const sdk = new BlinkIdSdkSettings(BLINKID_LICENSE_KEY);
  const session = new BlinkIdSessionSettings();
  session.scanningMode = ScanningMode.Single; // one side, no flip

  const ss = session.scanningSettings;
  // Door-speed: accept the first usable frame instead of waiting for a pristine
  // one. Safe for the PDF417 barcode (checksum-protected) and for the passport
  // MRZ (its own check digits).
  ss.skipImagesWithBlur = false;
  ss.skipImagesWithGlare = false;
  ss.skipImagesWithInadequateLightingConditions = false;
  ss.skipImagesOccludedByHand = false;
  ss.combineResultsFromMultipleInputImages = false;

  if (mode === 'PASSPORT') {
    ss.scanPassportDataPageOnly = true;
    ss.croppedImageSettings.returnFaceImage = true;
  } else {
    ss.enableBarcodeScanOnly = true; // back PDF417 only
    ss.croppedImageSettings.returnFaceImage = false;
  }

  const result: any = await performScan(sdk, session);
  if (!result) return null;

  const bc = barcodeSub(result); // BarcodeResult or null
  const be = bc?.extendedElements ?? {};
  // Prefer the normalized top-level field, fall back to the raw barcode field
  // (in barcode-only mode the top-level fields may be empty).
  const pick = (top: any, b: any) => str(top) ?? str(b);

  const payload: StructuredScanPayload = {
    document_type: mapDocType(result, mode),
    first_name: pick(result.firstName, bc?.firstName),
    last_name: pick(result.lastName, bc?.lastName),
    date_of_birth: isoDate(result.dateOfBirth) ?? isoDate(bc?.dateOfBirth),
    expiration_date: isoDate(result.dateOfExpiry) ?? isoDate(bc?.dateOfExpiry),
    sex: pick(result.sex, bc?.sex),
    height: str(be.height),
    eye_color: str(be.eyeColor),
    hair_color: str(be.hairColor),
    document_number: pick(result.documentNumber, bc?.documentNumber),
    address_state: pick(result.stateCode, be.addressJurisdictionCode),
    postal_code: str(be.addressPostalCode),
    nationality: str(result.nationality),
    data_match: dataMatch(result),
    scan_method: 'camera',
  };

  const img = result.faceImage?.image;
  const faceImage = typeof img === 'string' && img.length ? `data:image/jpeg;base64,${img}` : undefined;

  return { payload, faceImage };
}
