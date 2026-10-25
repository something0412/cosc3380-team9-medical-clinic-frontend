import { useState } from "react";
import type { FormEvent } from "react";
import { apiErrorMessage } from "../api";
import { ErrorText, Field, SelectField } from "./FormControls";
import { PrimaryButton } from "./ProfileUI";

export interface CardPayment {
  cardType: string;
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  amount: string;
}

// 4242424242424242 -> 4242 4242 4242 4242
const groupDigits = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

// 0828 -> 08/28
const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

// card fields for one payment; the page passes onPay, which sends the payment
export function CardPaymentForm({ balance, onPay }: { balance: string; onPay: (payment: CardPayment) => Promise<void> }) {
  const [cardType, setCardType] = useState("Credit Card");
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [amount, setAmount] = useState(Number(balance).toFixed(2));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const digits = cardNumber.replace(/\D/g, "");
  const lengthError = digits.length > 0 && digits.length !== 16 ? "The card number must be 16 digits" : "";

  // send the card payment
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (digits.length !== 16) {
      setError("The card number must be 16 digits");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onPay({ cardType, nameOnCard, cardNumber: digits, expiry, cvv, amount });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Card Type" value={cardType} onChange={(e) => setCardType(e.target.value)}>
          <option value="Credit Card">Credit card</option>
          <option value="Debit Card">Debit card</option>
        </SelectField>
        <Field label="Amount ($)" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Field label="Name on Card" required autoComplete="off" value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} />
      <div>
        <Field
          label="Card Number"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(groupDigits(e.target.value))}
        />
        <ErrorText message={lengthError} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Expiry (MM/YY)"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="08/28"
          value={expiry}
          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
        />
        <Field
          label="Security Code"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="123"
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </div>
      <ErrorText message={error} />
      <PrimaryButton disabled={saving}>{saving ? "Paying..." : `Pay $${Number(amount || 0).toFixed(2)}`}</PrimaryButton>
    </form>
  );
}
