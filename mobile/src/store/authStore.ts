// Auth state: API credentials + staff PIN, persisted in the iOS Keychain.
import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { hashPin } from '../utils/crypto';
import { normalizeApiUrl } from '../utils/validation';

const SERVICE_CREDENTIALS = 'idip_api_key';
const SERVICE_PIN = 'idip_pin';

export interface Credentials {
  apiUrl: string;
  apiKey: string;
  staffName: string;
}

interface AuthState {
  apiUrl: string | null;
  apiKey: string | null;
  staffName: string | null;
  isAuthenticated: boolean;
  hasCredentials: boolean;
  loadCredentials: () => Promise<boolean>;
  saveSetup: (creds: Credentials, pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  reset: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  apiUrl: null,
  apiKey: null,
  staffName: null,
  isAuthenticated: false,
  hasCredentials: false,

  async loadCredentials() {
    const stored = await Keychain.getGenericPassword({ service: SERVICE_CREDENTIALS });
    if (!stored) {
      set({ hasCredentials: false });
      return false;
    }
    const creds: Credentials = JSON.parse(stored.password);
    set({
      apiUrl: creds.apiUrl,
      apiKey: creds.apiKey,
      staffName: creds.staffName,
      hasCredentials: true,
    });
    return true;
  },

  async saveSetup(creds, pin) {
    const normalized = { ...creds, apiUrl: normalizeApiUrl(creds.apiUrl) };
    await Keychain.setGenericPassword('idip', JSON.stringify(normalized), {
      service: SERVICE_CREDENTIALS,
    });
    await Keychain.setGenericPassword('pin', hashPin(pin), { service: SERVICE_PIN });
    set({ ...normalized, hasCredentials: true });
  },

  async verifyPin(pin) {
    const stored = await Keychain.getGenericPassword({ service: SERVICE_PIN });
    if (!stored) return false;
    const ok = stored.password === hashPin(pin);
    if (ok) set({ isAuthenticated: true });
    return ok;
  },

  logout() {
    set({ isAuthenticated: false });
  },

  async reset() {
    await Keychain.resetGenericPassword({ service: SERVICE_CREDENTIALS });
    await Keychain.resetGenericPassword({ service: SERVICE_PIN });
    set({
      apiUrl: null,
      apiKey: null,
      staffName: null,
      isAuthenticated: false,
      hasCredentials: false,
    });
  },
}));
