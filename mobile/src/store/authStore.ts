// Auth state. The backend URL + venue API key come from build-time config
// (provisioned per venue); door staff only set their name + PIN, which are
// persisted in the iOS Keychain.
import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { hashPin } from '../utils/crypto';
import { API_KEY, API_URL } from '../config';

const SERVICE_STAFF = 'idip_staff';
const SERVICE_PIN = 'idip_pin';

interface AuthState {
  apiUrl: string;
  apiKey: string;
  staffName: string | null;
  isAuthenticated: boolean;
  hasCredentials: boolean; // a staff name + PIN have been set up on this device
  loadCredentials: () => Promise<boolean>;
  saveSetup: (staffName: string, pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  reset: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Backend connection is fixed by the build, not the user.
  apiUrl: API_URL,
  apiKey: API_KEY,
  staffName: null,
  isAuthenticated: false,
  hasCredentials: false,

  async loadCredentials() {
    const stored = await Keychain.getGenericPassword({ service: SERVICE_STAFF });
    if (!stored) {
      set({ hasCredentials: false });
      return false;
    }
    set({ staffName: stored.password, hasCredentials: true });
    return true;
  },

  async saveSetup(staffName, pin) {
    await Keychain.setGenericPassword('staff', staffName, { service: SERVICE_STAFF });
    await Keychain.setGenericPassword('pin', hashPin(pin), { service: SERVICE_PIN });
    set({ staffName, hasCredentials: true });
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
    await Keychain.resetGenericPassword({ service: SERVICE_STAFF });
    await Keychain.resetGenericPassword({ service: SERVICE_PIN });
    set({ staffName: null, isAuthenticated: false, hasCredentials: false });
  },
}));
