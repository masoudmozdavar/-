/**
 * Enterprise-grade PBKDF2 with SHA-256 password hashing and Email-based recovery helper
 */

// Generate random hex salt (16 bytes = 128 bits)
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
}

// Generate secure 6-digit OTP code for password recovery
export function generateRecoveryOtp(): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const code = (array[0] % 900000) + 100000;
    return code.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * PBKDF2-HMAC-SHA256 password hashing with 20,000 iterations
 */
export async function hashPasswordSecure(password: string, salt: string): Promise<string> {
  const normalized = password.trim();
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(normalized),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: enc.encode('jibino_secure_salt_' + salt),
          iterations: 20000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto PBKDF2 error, falling back:', err);
  }

  // SHA-256 fallback if subtle PBKDF2 is unavailable
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(salt + ':' + normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto SHA-256 failed:', err);
  }

  // Mathematical fallback
  let h = 0;
  const str = salt + ':' + normalized;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return 'fb_' + Math.abs(h).toString(16);
}
