import { InvoiceLines } from "./InvoiceLines";
import type { InvoiceItem } from "./InvoiceLines";
import { PrintReport, ReportSection, ReportTable } from "./PrintReport";
import { formatId } from "../utils/id";

export interface InvoiceReportData {
  invoiceId: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  doctorName: string;
  officeName: string;
  issueDate: string;
  amount: string;
  paid: string;
  balance: string;
  status: string;
  items: InvoiceItem[];
  payments: { paymentId: number; paymentDate: string; amountPaid: string; paymentType: string; status: string }[];
}

const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

// the printable invoice, used by the patient, front desk and admin billing pages
export function InvoiceReport({ invoice }: { invoice: InvoiceReportData }) {
  return (
    <PrintReport title={`Invoice #${invoice.invoiceId}`} subtitle={`Issued ${invoice.issueDate} · ${invoice.status}`}>
      <ReportSection title="Bill To">
        <p className="font-medium">{invoice.patientName}</p>
        <p className="text-slate-600">Patient ID {formatId(invoice.patientId)}</p>
        <p className="mt-2 text-slate-600">
          Visit on {invoice.appointmentDate} with Dr. {invoice.doctorName} at {invoice.officeName}
        </p>
      </ReportSection>

      <ReportSection title="Charges">
        <InvoiceLines items={invoice.items} />
      </ReportSection>

      <ReportSection title="Payments">
        {invoice.payments.length === 0 ? (
          <p className="text-slate-500">No payments yet.</p>
        ) : (
          <>
            <ReportTable
              headers={["Date", "Paid With", "Status", "Amount"]}
              alignRight={[3]}
              rows={invoice.payments.map((p) => [p.paymentDate, p.paymentType, p.status === "Requested" ? "Refund Requested" : p.status, money(p.amountPaid)])}
            />
            <p className="mt-2 text-xs text-slate-500">Refunded payments don't count toward what's been paid.</p>
          </>
        )}
      </ReportSection>

      <ReportSection title="Summary">
        <ReportTable
          headers={["", "Amount"]}
          alignRight={[1]}
          rows={[
            ["Invoice total", money(invoice.amount)],
            ["Paid", money(invoice.paid)],
            [<span className="font-semibold">Balance due</span>, <span className="font-semibold">{money(invoice.balance)}</span>],
          ]}
        />
      </ReportSection>
    </PrintReport>
  );
}
