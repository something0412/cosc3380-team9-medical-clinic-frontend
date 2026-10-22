import { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface Invoice {
    invoiceId: number;
    issueDate: string;
    amount: number | string;
    status: string;
}

interface Payment {
    paymentId: number;
    invoiceId: number;
    paymentDate: string;
    amountPaid: number | string;
    paymentType: string;
}

interface BillingData {
    invoices: Invoice[];
    payments: Payment[];
}

export function PatientBilling() {
    const { user } = useAuth();
    const patientId = user?.role === "patient" ? user.id : null;

    const [billing, setBilling] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadBilling() {
            setLoading(true);
            setError("");
            setBilling(null);

            if (patientId === null || !Number.isSafeInteger(patientId) || patientId <= 0) {
                if (active) {
                    setError("Patient information was not found. Please log in again.");
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await api.get<BillingData>(
                    `/api/patient/${patientId}/billing`
                );

                if (active) {
                    setBilling(response.data);
                    setError("");
                }
            } catch (err) {
                console.error("Could not load patient billing:", err);

                if (active) {
                    setError("Billing information could not be loaded.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadBilling();

        return () => { active = false; };
    }, [patientId]);

    const money = (amount: number | string) => {
        return `$${Number(amount).toFixed(2)}`;
    };

    const balance = billing?.invoices.reduce((total, invoice) => {
        const paid = billing.payments
            .filter((payment) => payment.invoiceId === invoice.invoiceId)
            .reduce((sum, payment) => sum + Number(payment.amountPaid), 0);

        return total + Math.max(0, Number(invoice.amount) - paid);
    }, 0) ?? 0;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Billing & Payments</h2>
                <p className="text-gray-600 mt-1">
                    View your invoices, remaining balance, and payment history.
                </p>
            </div>

            {loading && <p>Loading billing information...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {billing && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Outstanding Balance</h3>
                            <p className="text-2xl font-bold mt-2">{money(balance)}</p>
                        </div>

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Total Invoices</h3>
                            <p className="text-2xl font-bold mt-2">{billing.invoices.length}</p>
                        </div>
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">My Invoices</h3>

                        {billing.invoices.length === 0 ? (
                            <p className="text-gray-500">No invoices found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Invoice ID</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.invoices.map((invoice) => (
                                            <tr key={invoice.invoiceId} className="border-b">
                                                <td className="p-3">#{invoice.invoiceId}</td>
                                                <td className="p-3">
                                                    {invoice.issueDate?.slice(0, 10) || "N/A"}
                                                </td>
                                                <td className="p-3">{money(invoice.amount)}</td>
                                                <td className="p-3">{invoice.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">Payment History</h3>

                        {billing.payments.length === 0 ? (
                            <p className="text-gray-500">No payments found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Payment ID</th>
                                            <th className="p-3">Invoice</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Method</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.payments.map((payment) => (
                                            <tr key={payment.paymentId} className="border-b">
                                                <td className="p-3">#{payment.paymentId}</td>
                                                <td className="p-3">#{payment.invoiceId}</td>
                                                <td className="p-3">
                                                    {payment.paymentDate?.slice(0, 10) || "N/A"}
                                                </td>
                                                <td className="p-3">{money(payment.amountPaid)}</td>
                                                <td className="p-3">{payment.paymentType}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-500">
                        Online payments are not available yet.
                    </p>
                </>
            )}
        </div>
    );
}