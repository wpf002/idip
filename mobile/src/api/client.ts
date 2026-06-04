// Typed IDIP API client (fetch-based; works in RN and Node/Jest).

export class IDIPNetworkError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'IDIPNetworkError';
    this.status = status;
  }
}

export interface ScanPayload {
  barcode_data: string;
  document_input_type?: 'PDF417' | 'MRZ' | 'AUTO';
  staff_id?: string | null;
  scan_method?: 'camera' | 'manual';
  client_timestamp?: string;
}

export interface ScanResult {
  scan_id: string;
  result: 'ALLOW' | 'REVIEW' | 'DENY';
  risk_score: number;
  age: number | null;
  is_valid_age: boolean;
  is_expired: boolean;
  state: string | null;
  name: string | null;
  flags: Array<{ code: string; message: string; weight: number }>;
  challenge_available: boolean;
  challenge_required: boolean;
}

export class IDIPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init.headers || {}) },
    });
    if (!resp.ok) {
      throw new IDIPNetworkError(resp.status, `Request to ${path} failed: ${resp.status}`);
    }
    return (await resp.json()) as T;
  }

  scan(payload: ScanPayload): Promise<ScanResult> {
    return this.request<ScanResult>('/v1/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  submitChallenge(scanId: string, failures: number): Promise<ScanResult> {
    return this.request('/v1/challenge', {
      method: 'POST',
      body: JSON.stringify({ scan_id: scanId, failures }),
    });
  }

  sync(records: ScanPayload[]): Promise<{ synced: number; results: unknown[] }> {
    return this.request('/v1/sync', {
      method: 'POST',
      body: JSON.stringify(records),
    });
  }

  getLogs(params: { decision?: string; state?: string; limit?: number; offset?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.decision) qs.set('decision', params.decision);
    if (params.state) qs.set('state', params.state);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return this.request(`/v1/logs${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  getMetrics(period = 'today') {
    return this.request(`/v1/metrics?period=${encodeURIComponent(period)}`, {
      method: 'GET',
    });
  }
}
