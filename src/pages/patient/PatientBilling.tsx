import { useEffect, useState } from "react";
import { BillingSummary } from "../../components/BillingSummary";
import { useAuth } from "../../context/AuthContext";
import { getBilling } from "../../services/billingApi";
import type { BillingData } from "../../types";

export function PatientBilling() {
    const { user } = useAuth();
    const [billing, setBilling] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadBilling() {
            if (!user) return;
            try {
                const data = await getBilling(user.id);
                if (active) setBilling(data);
            } catch {
                if (active) setError("Billing information could not be loaded.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadBilling();
        return () => { active = false; };
    }, [user]);

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
                    <BillingSummary billing={billing} />
                    <p className="text-sm text-gray-500">
                        To make a payment, please contact the front desk.
                    </p>
                </>
            )}
        </div>
    );
}
