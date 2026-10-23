import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
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
    const [refresh, setRefresh] = useState(0);


    //load the patient's billing information
    useEffect(() => {
        let active = true;

        async function loadBilling() {
            setLoading(true);
            setError("");

            if (patientId === null || !Number.isSafeInteger(patientId) || patientId <= 0) {
                if (active) {
                    setBilling(null);
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
                }

            } catch (err) {
                if (active) {
                    setBilling(null);
                    setError(apiErrorMessage(err));
                }

            } finally {
                if (active) setLoading(false);
            }
        }

        loadBilling();

        return () => { active = false; };

    }, [patientId, refresh]);


    //format numbers as money
    function money(amount: number | string) {
        const value = Number(amount);

        if (!Number.isFinite(value)) return "N/A";

        return `$${value.toFixed(2)}`;
    }


    //calculate how much was paid for an invoice
    function amountPaid(invoiceId: number) {
        if (!billing) return 0;

        return billing.payments
            .filter(payment => payment.invoiceId === invoiceId)
            .reduce((total, payment) => {
                return total + Number(payment.amountPaid);
            }, 0);
    }


    //calculate the remaining amount on an invoice
    function remainingBalance(invoice: Invoice) {
        const paid = amountPaid(invoice.invoiceId);

        return Math.max(0, Number(invoice.amount) - paid);
    }


    //calculate the patient's total balance
    const balance = billing?.invoices.reduce((total, invoice) => {
        return total + remainingBalance(invoice);
    }, 0) ?? 0;


    //calculate total payments
    const totalPayments = billing?.payments.reduce((total, payment) => {
        return total + Number(payment.amountPaid);
    }, 0) ?? 0;


    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            <div>
                <h2 className="text-2xl font-bold">Billing & Payments</h2>

                <p className="text-gray-600 mt-1">
                    View your invoices, remaining balance, and payment history.
                </p>
            </div>


            <div>
                <button
                    type="button"
                    onClick={() => setRefresh(n => n + 1)}
                    disabled={loading}
                    className="border rounded-lg px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Refresh Billing"}
                </button>
            </div>


            {loading && (
                <p>Loading billing information...</p>
            )}

            {error && (
                <p className="text-red-600" role="alert">
                    {error}
                </p>
            )}


            {billing && !loading && (
                <>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">
                                Outstanding Balance
                            </h3>

                            <p className="text-2xl font-bold mt-2">
                                {money(balance)}
                            </p>
                        </div>

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">
                                Total Invoices
                            </h3>

                            <p className="text-2xl font-bold mt-2">
                                {billing.invoices.length}
                            </p>
                        </div>

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">
                                Total Payments
                            </h3>

                            <p className="text-2xl font-bold mt-2">
                                {money(totalPayments)}
                            </p>
                        </div>

                    </div>


                    <div className="border rounded-lg p-5">

                        <h3 className="text-lg font-semibold mb-4">
                            My Invoices
                        </h3>

                        {billing.invoices.length === 0 ? (
                            <p className="text-gray-500">
                                No invoices found.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">

                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Invoice ID</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Paid</th>
                                            <th className="p-3">Remaining</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {billing.invoices.map(invoice => (
                                            <tr
                                                key={invoice.invoiceId}
                                                className="border-b"
                                            >
                                                <td className="p-3">
                                                    #{invoice.invoiceId}
                                                </td>

                                                <td className="p-3">
                                                    {invoice.issueDate?.slice(0, 10) || "N/A"}
                                                </td>

                                                <td className="p-3">
                                                    {money(invoice.amount)}
                                                </td>

                                                <td className="p-3">
                                                    {money(amountPaid(invoice.invoiceId))}
                                                </td>

                                                <td className="p-3">
                                                    {money(remainingBalance(invoice))}
                                                </td>

                                                <td className="p-3">
                                                    {invoice.status}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            </div>
                        )}

                    </div>


                    <div className="border rounded-lg p-5">

                        <h3 className="text-lg font-semibold mb-4">
                            Payment History
                        </h3>

                        {billing.payments.length === 0 ? (
                            <p className="text-gray-500">
                                No payments found.
                            </p>
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
                                        {billing.payments.map(payment => (
                                            <tr
                                                key={payment.paymentId}
                                                className="border-b"
                                            >
                                                <td className="p-3">
                                                    #{payment.paymentId}
                                                </td>

                                                <td className="p-3">
                                                    #{payment.invoiceId}
                                                </td>

                                                <td className="p-3">
                                                    {payment.paymentDate?.slice(0, 10) || "N/A"}
                                                </td>

                                                <td className="p-3">
                                                    {money(payment.amountPaid)}
                                                </td>

                                                <td className="p-3">
                                                    {payment.paymentType}
                                                </td>
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