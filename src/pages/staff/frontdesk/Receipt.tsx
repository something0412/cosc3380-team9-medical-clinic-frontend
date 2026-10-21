import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReceipt, money } from "../../../services/billingApi";
import type { Receipt as ReceiptData } from "../../../types";

// A printable receipt for one payment. "Paid to date" and "balance after"
// are as of this payment, so reprinting an old receipt shows the balance
// as it was then. The sidebar and buttons are hidden when printing.
export function Receipt() {
  const { paymentId } = useParams();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getReceipt(Number(paymentId))
      .then(setReceipt)
      .catch(() => setError("Could not load this receipt."));
  }, [paymentId]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!receipt) return <p className="text-sm text-gray-500">Loading receipt…</p>;

  const rows: [string, string][] = [
    ["Patient", `${receipt.patientName} (#${receipt.patientId})`],
    ["Visit date", receipt.visitDate],
    ["Invoice", `#${receipt.invoiceId} · ${money(receipt.invoiceAmount)}`],
    ["Payment date", receipt.paymentDate],
    ["Method", receipt.paymentType],
    ["Amount paid", money(receipt.amountPaid)],
    ["Paid to date", money(receipt.paidToDate)],
    ["Balance remaining", money(receipt.balanceAfter)],
    ["Received by", receipt.handledBy ?? "—"],
  ];

  return (
    <div className="max-w-md">
      <div className="mb-4 flex gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Print
        </button>
        <Link to="/staff/billing" className="px-2 py-2 text-sm text-blue-700 hover:underline">
          Back to billing
        </Link>
      </div>

      <div className="rounded border border-gray-300 bg-white p-6">
        <h1 className="text-lg font-semibold text-gray-900">{receipt.officeName}</h1>
        <p className="text-sm text-gray-600">{receipt.officeAddress}</p>
        <p className="text-sm text-gray-600">{receipt.officePhone}</p>

        <h2 className="mt-4 border-t border-gray-200 pt-4 font-semibold text-gray-900">
          Payment receipt #{receipt.paymentId}
        </h2>
        <dl className="mt-2 space-y-1 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-gray-600">{label}</dt>
              <dd className="font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
