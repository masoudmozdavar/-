import { Transaction, FamilyMember, FamilyAllowanceRequest } from '../types';

const BROADCAST_CHANNEL_NAME = 'smart_finance_family_sync_bus_v1';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not available', e);
  }
}

export type FamilySyncEvent = 
  | { type: 'TX_ADDED'; transaction: Transaction }
  | { type: 'MEMBER_UPDATED'; members: FamilyMember[] }
  | { type: 'REQUEST_SUBMITTED'; request: FamilyAllowanceRequest }
  | { type: 'FULL_STATE_UPDATE'; transactions: Transaction[]; members: FamilyMember[]; requests: FamilyAllowanceRequest[] };

export function broadcastFamilyEvent(event: FamilySyncEvent) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (e) {
      console.warn('Failed to broadcast family event', e);
    }
  }
}

export function listenToFamilyEvents(callback: (event: FamilySyncEvent) => void): () => void {
  if (!broadcastChannel) {
    return () => {};
  }
  const handler = (msg: MessageEvent<FamilySyncEvent>) => {
    if (msg.data) {
      callback(msg.data);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}

// Remote server sync API
export async function syncTransactionWithServer(transaction: Transaction): Promise<boolean> {
  try {
    const res = await fetch('/api/family/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncRequestWithServer(request: FamilyAllowanceRequest): Promise<boolean> {
  try {
    const res = await fetch('/api/family/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchServerFamilyState(): Promise<{
  transactions?: Transaction[];
  requests?: FamilyAllowanceRequest[];
  members?: FamilyMember[];
} | null> {
  try {
    const res = await fetch('/api/family/state');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function pushFullSyncToServer(payload: {
  transactions: Transaction[];
  requests: FamilyAllowanceRequest[];
  members: FamilyMember[];
}): Promise<boolean> {
  try {
    const res = await fetch('/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Utility to generate a direct member access URL
export function generateMemberAccessURL(memberId: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}?memberId=${encodeURIComponent(memberId)}`;
}

export const getMemberDirectURL = generateMemberAccessURL;

// Detect member ID from URL params or hash
export function getMemberIdFromCurrentURL(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('memberId') || urlParams.get('member');
    if (memberId) return memberId;

    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashMember = hashParams.get('memberId') || hashParams.get('member');
      if (hashMember) return hashMember;
    }
  } catch {
    // Ignore URL parse error
  }
  return null;
}
