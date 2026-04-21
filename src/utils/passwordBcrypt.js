import bcrypt from 'bcryptjs';

const encoder = new TextEncoder();

const sha256Hex = async (value) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value || '')));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const hashPasswordBcryptForRegister = async (password) => {
  const value = String(password || '');
  return bcrypt.hash(value, 10);
};

export const hashPasswordBcryptForLogin = async (password, salt) => {
  const value = String(password || '');
  const saltValue = String(salt || '');
  return bcrypt.hash(value, saltValue);
};

export const hashPasswordBcryptForLegacySha256Login = async (password, salt) => {
  const legacyValue = await sha256Hex(password);
  const saltValue = String(salt || '');
  return bcrypt.hash(legacyValue, saltValue);
};
