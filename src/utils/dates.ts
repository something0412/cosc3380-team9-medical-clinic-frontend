// Small date helpers shared by the front desk and nursing pages.

// Today as "YYYY-MM-DD" in local time ("en-CA" happens to use that format),
// which is what the backend's date filters expect.
export function today() {
  return new Date().toLocaleDateString("en-CA");
}

// "9:30 AM" from an ISO date-time.
export function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
