// BlinkID (Microblink) scanning, tuned for door speed.
//
// Both document types scan a SINGLE side — no card flip, which was the main
// source of delay (the default "automatic" mode captures front, makes you flip,
// captures the back, then combines). One capture is plenty for the door.
//
// Driver's licenses: the FRONT (photo side). We read the visual zone via OCR —
// name, date of birth, expiry, sex — and capture the face photo. This matches
// the natural instinct to show the photo side. (Trade-off vs. the back barcode:
// no height/eye/hair, and OCR is slightly less robust than a checksummed
// barcode, so we KEEP BlinkID's image quality gates on here — a misread DOB
// would corrupt the age check, which we never want to trade for speed.)
//
// Passports: single data-page scan — keeps the face and the MRZ in one capture.
// The glossy laminate throws a lot of glare under venue lighting, so the
// default quality gates would reject frame after frame and the scan would never
// complete. The MRZ has its own check digits (like a barcode), so we drop the
// gates for passports too — a bad frame fails the checksum and is retried, it
// can't yield wrong data.
import {
  performScan,
  BlinkIdSdkSettings,
  BlinkIdSessionSettings,
  ScanningMode,
  DetectionLevel,
} from '@microblink/blinkid-react-native';
import { BLINKID_LICENSE_KEY } from '../blinkidLicense';
import type { StructuredScanPayload } from '../api/client';
import type { ScanMode } from '../screens/ScanHomeScreen';

export interface BlinkIdScan {
  payload: StructuredScanPayload;
  faceImage?: string; // data URI
}

function isoDate(d: any): string | undefined {
  const dt = d?.date ?? d;
  if (!dt?.year || !dt?.month || !dt?.day) return undefined;
  return `${dt.year}-${String(dt.month).padStart(2, '0')}-${String(dt.day).padStart(2, '0')}`;
}

// Accepts both StringResult ({value}) and plain-string fields.
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

// The parsed AAMVA barcode, if a back side happened to be captured.
function barcodeSub(result: any): any {
  return (result?.subResults ?? []).find((s: any) => s?.barcode)?.barcode ?? null;
}

export async function scanWithBlinkId(mode: ScanMode = 'DL'): Promise<BlinkIdScan | null> {
  const sdk = new BlinkIdSdkSettings(BLINKID_LICENSE_KEY);
  const session = new BlinkIdSessionSettings();
  session.scanningMode = ScanningMode.Single; // one side, no flip

  const ss = session.scanningSettings;
  ss.croppedImageSettings.returnFaceImage = true; // face is on the DL front / passport data page

  // Be permissive about framing/quality detection so BlinkID stops looping on
  // "move farther away / reduce glare" and accepts a workable frame. The big
  // driver is the iPhone's minimum focus distance: a card held close enough to
  // fill the frame is too close to focus, so the image is soft and BlinkID asks
  // you to move it back — then wants more detail once it's far. Low detection
  // accepts the slightly-soft, real-world frame instead of nagging.
  ss.blurDetectionLevel = DetectionLevel.Low;
  ss.glareDetectionLevel = DetectionLevel.Low;
  ss.tiltDetectionLevel = DetectionLevel.Low;

  if (mode === 'PASSPORT') {
    ss.scanPassportDataPageOnly = true;
    // MRZ self-validates (check digits) — relax the gates so glare/dim light on
    // the glossy page can't stall the scan, and take the first valid frame.
    ss.skipImagesWithBlur = false;
    ss.skipImagesWithGlare = false;
    ss.skipImagesWithInadequateLightingConditions = false;
    ss.skipImagesOccludedByHand = false;
    ss.combineResultsFromMultipleInputImages = false;
  } else {
    // DL front (OCR). Skip only the worst frames (Low detection above) and
    // accept the front read without demanding perfect certainty, so it
    // completes instead of endlessly asking to reframe.
    ss.allowUncertainFrontSideScan = true;
  }

  const result: any = await performScan(sdk, session);
  if (!result) return null;

  const bc = barcodeSub(result); // usually null for a front scan
  const be = bc?.extendedElements ?? {};
  // Prefer the normalized top-level (VIZ) field, fall back to a barcode field.
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
