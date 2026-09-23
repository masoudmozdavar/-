import { SecurityLockConfig } from '../types';

const SECURITY_STORAGE_KEY = 'hesab_security_lock_config_v1';

// Consistent salt for local PIN verification
const PIN_SALT = 'finance_pro_secure_salt_';

export async function hashPin(pin: string): Promise<string> {
  const normalizedPin = pin.trim();
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(PIN_SALT + normalizedPin);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Crypto subtle not available or failed:', err);
  }
  // Simple fallback hash
  let hash = 0;
  const str = PIN_SALT + normalizedPin;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

// Check if browser supports WebAuthn and platform biometric authenticators (Touch ID, Face ID, Windows Hello, Android Biometrics)
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return !!available;
    }
    return false;
  } catch (err) {
    console.warn('Biometric support check failed:', err);
    return false;
  }
}

// Register / enroll biometric credential
export async function registerBiometric(username = 'Masoud'): Promise<string | null> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return null;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Finance Pro',
          id: window.location.hostname || 'localhost',
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      }
    }) as PublicKeyCredential | null;

    if (credential && credential.id) {
      return credential.id;
    }
    return null;
  } catch (err: any) {
    console.warn('Biometric registration error or cancelled:', err?.message || err);
    return null;
  }
}

// Authenticate via Biometric prompt
export async function authenticateBiometric(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
        rpId: window.location.hostname || 'localhost',
      }
    });

    return !!assertion;
  } catch (err: any) {
    console.warn('Biometric authentication failed or cancelled:', err?.message || err);
    return false;
  }
}

// Load or initialize security configuration
export function loadSecurityConfig(): SecurityLockConfig {
  if (typeof window === 'undefined') {
    return {
      isEnabled: false,
      pinHash: '',
      hasBiometric: false,
      autoLockMinutes: 15,
      lastUnlockedAt: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isEnabled: parsed.isEnabled ?? false,
        pinHash: parsed.pinHash || '',
        hasBiometric: parsed.hasBiometric ?? false,
        biometricCredentialId: parsed.biometricCredentialId,
        autoLockMinutes: parsed.autoLockMinutes ?? 15,
        lastUnlockedAt: parsed.lastUnlockedAt || Date.now(),
      };
    }
  } catch (err) {
    console.error('Failed to load security config:', err);
  }

  // Default initial configuration:
  // App lock is optional and disabled by default until the user enables it,
  // preventing sudden locking right after registration.
  return {
    isEnabled: false,
    pinHash: '',
    hasBiometric: false,
    autoLockMinutes: 15,
    lastUnlockedAt: Date.now(),
  };
}

export function saveSecurityConfig(config: SecurityLockConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save security config:', err);
  }
}
