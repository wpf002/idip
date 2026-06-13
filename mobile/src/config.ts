// Deployment configuration — provisioned per venue at build time, NOT entered
// by door staff. Staff only authenticate with their name + PIN.
//
// Production: set API_URL to your deployed backend domain (e.g.
// "https://api.idip.app") and API_KEY to this venue's key. To target a
// different venue, change API_KEY and rebuild (or move to a manager
// "activation" flow / real login for multi-venue fleets).

export const API_URL = 'https://backend-production-c1f7.up.railway.app';
export const API_KEY = 'idip_eduOppnof1ayWwvS1mNkqrV792ynz_ArxZPEY300Wd0';

export const HAS_BACKEND_CONFIG = Boolean(API_URL && API_KEY);
