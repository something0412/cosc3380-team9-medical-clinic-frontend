import { money } from "../services/billingApi";
import type { BillingData } from "../types";

// One patient's insurance, balance, invoices and payment history. Shared
// by the patient's own Billing page (read-only) and the receptionist's
// Billing page (which adds its create-invoice / record-payment forms
// around it).
export function BillingSummary({ billing }: { billing: BillingData }) {
  // Each invoice's balance is worked out by the backend in SQL.
  const outstanding = billing.invoices.reduce((total, invoice) => total + Number(invoice.balance), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-5">
          <h3 className="font-semibold">Outstanding Balance</h3>
          <p className="mt-2 text-2xl font-bold">{money(outstanding)}</p>
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="font-semibold">Total Invoices</h3>
          <p className="mt-2 text-2xl font-bold">{billing.invoices.length}</p>
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="font-semibold">Insurance</h3>
          {billing.insurance ? (
            <p className="mt-2 text-sm text-gray-700">
              {billing.insurance.provider} · #{billing.insurance.policyNumber}
              <br />
              <span className="text-gray-500">{billing.insurance.status}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">None on file</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <h3 className="mb-4 text-lg font-semibold">Invoices</h3>
        {billing.invoices.length === 0 ? (
          <p className="text-gray-500">No invoices found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Invoice</th>
                  <th className="p-2">Visit</th>
                  <th className="p-2">Issued</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Paid</th>
                  <th className="p-2">Balance</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.invoices.map((invoice) => (
                  <tr key={invoice.invoiceId} className="border-b">
                    <td className="p-2">#{invoice.invoiceId}</td>
                    <td className="p-2">{invoice.appointmentDate}</td>
                    <td className="p-2">{invoice.issueDate}</td>
                    <td className="p-2">{money(invoice.amount)}</td>
                    <td className="p-2">{money(invoice.amountPaid)}</td>
                    <td className="p-2 font-medium">{money(invoice.balance)}</td>
                    <td className="p-2">{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-5">
        <h3 className="mb-4 text-lg font-semibold">Payment History</h3>
        {billing.payments.length === 0 ? (
          <p className="text-gray-500">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Payment</th>
                  <th className="p-2">Invoice</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Method</th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map((payment) => (
                  <tr key={payment.paymentId} className="border-b">
                    <td className="p-2">#{payment.paymentId}</td>
                    <td className="p-2">#{payment.invoiceId}</td>
                    <td className="p-2">{payment.paymentDate}</td>
                    <td className="p-2">{money(payment.amountPaid)}</td>
                    <td className="p-2">{payment.paymentType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
