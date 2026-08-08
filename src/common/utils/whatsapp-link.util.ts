import { formatEgyptianPhoneNumber } from './phone-formatter.util';

export function createWhatsAppLink(phoneNumber: string, listingTitle: string): string {
  const formattedPhone = formatEgyptianPhoneNumber(phoneNumber).slice(1);
  const message = encodeURIComponent(`Hello, I am interested in your ShopSpace listing: ${listingTitle}`);
  return `https://wa.me/${formattedPhone}?text=${message}`;
}
