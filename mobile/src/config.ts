// Deployment configuration — provisioned per venue at build time, NOT entered
// by door staff. Staff only authenticate with their name + PIN.
//
// Production: set API_URL to your deployed backend domain (e.g.
// "https://api.idip.app") and API_KEY to this venue's key. To target a
// different venue, change API_KEY and rebuild (or move to a manager
// "activation" flow / real login for multi-venue fleets).

export const API_URL = 'http://192.168.1.212:8080';
export const API_KEY = 'idip_aYiArjcm_UALfHh6TaVSAgFnEoKYjN6zAVaNmQIAV6U';

export const HAS_BACKEND_CONFIG = Boolean(API_URL && API_KEY);
