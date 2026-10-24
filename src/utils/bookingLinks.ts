// the booking pages a patient can be sent back to after signing in
const BOOKING_PATH = /^\/book(\/review|\/confirmed\/[1-9]\d*)?$/;

// a safe booking page to return to after signing in, or null for anything else
export function safeBookingPath(value: string | null) {
  // only plain paths on this site, nothing with a scheme, a host, spaces, or backslashes
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, window.location.origin);
  } catch {
    return null;
  }
  // the parsed path is checked too, so tricks like /book/../patient/billing don't get through
  if (url.origin !== window.location.origin || !BOOKING_PATH.test(url.pathname)) return null;
  return url.pathname + url.search;
}

// the patient sign in page, set to come back to a booking page afterwards
export function loginForBooking(path: string, signup = false) {
  const params = new URLSearchParams({ next: path });
  if (signup) params.set("mode", "signup");
  return `/login?${params}`;
}
