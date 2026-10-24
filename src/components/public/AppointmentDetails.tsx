import type { ReactNode } from "react";
import { OfficeAddress } from "./OfficeAddress";
import type { PublicOffice } from "../../services/publicApi";
import { formatDate, formatTime } from "../../utils/clinicTime";

interface AppointmentDetailsProps {
  specialty: string;
  doctorName: string;
  officeName: string;
  // the full office, when it has loaded, for the address
  office: PublicOffice | null;
  date: string;
  startTime: string;
  endTime: string;
  // extra rows after the time, like the referral or status
  children?: ReactNode;
}

// an appointment as a plain list of details separated by thin lines
export function AppointmentDetails({ specialty, doctorName, officeName, office, date, startTime, endTime, children }: AppointmentDetailsProps) {
  return (
    <dl className="divide-y divide-slate-200 border-y border-slate-200">
      <DetailRow label="Specialty">{specialty}</DetailRow>
      <DetailRow label="Doctor">Dr. {doctorName}</DetailRow>
      <DetailRow label="Location">
        <span className="block">{officeName}</span>
        {office && <OfficeAddress office={office} className="text-slate-600" />}
      </DetailRow>
      <DetailRow label="Date">{formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</DetailRow>
      <DetailRow label="Time">
        {formatTime(startTime)} to {formatTime(endTime)} Central Time
      </DetailRow>
      {children}
    </dl>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-6">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  );
}
