import type { PublicOffice } from "../../services/publicApi";

type Address = Pick<PublicOffice, "street" | "apt" | "city" | "state" | "zip">;

export function OfficeAddress({ office, className = "" }: { office: Address; className?: string }) {
  return (
    <address className={`not-italic leading-relaxed ${className}`}>
      {office.street}
      {office.apt && `, ${office.apt}`}
      <br />
      {office.city}, {office.state} {office.zip}
    </address>
  );
}
