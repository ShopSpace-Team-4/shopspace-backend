import { BadRequestException } from '../exceptions';

/** Converts a valid Egyptian mobile number to E.164 format. */
export function formatEgyptianPhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim().replace(/[\s()-]/g, '');
  const localNumber = normalized.replace(/^\+?20/, '0');

  if (!/^01[0125]\d{8}$/.test(localNumber)) {
    throw new BadRequestException('Invalid Egyptian phone number');
  }

  return `+20${localNumber.slice(1)}`;
}
