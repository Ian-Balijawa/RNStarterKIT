export type LedgerProfile = {
  name: string;
  phone: string;
};

export function validateProfile(name: string, phone: string): string | null {
  if (!name.trim()) return 'Enter your name.';
  const normalized = phone.trim();
  if (
    !/^\+?[\d\s()-]+$/.test(normalized) ||
    normalized.replace(/\D/g, '').length < 7
  ) {
    return 'Enter a valid phone number.';
  }
  return null;
}
