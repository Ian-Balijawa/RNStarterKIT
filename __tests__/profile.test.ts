import { validateProfile } from '../src/features/ledger/profile';

test('profile registration requires a name and usable phone number', () => {
  expect(validateProfile(' ', '+256 700 000 000')).toBe('Enter your name.');
  expect(validateProfile('Amina', '123')).toBe('Enter a valid phone number.');
  expect(validateProfile('Amina', '+256 700 000 000')).toBeNull();
});
