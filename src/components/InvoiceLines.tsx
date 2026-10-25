export interface InvoiceItem {
  invoiceItemId: number;
  category: string;
  description: string;
  price: string;
}

// what an invoice charges for: the visit, lab tests, and medications
export function InvoiceLines({ items }: { items: InvoiceItem[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">No charges on this invoice.</p>;
  const total = items.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <table className="w-full text-left text-sm">
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => (
          <tr key={item.invoiceItemId}>
            <td className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.category}</td>
            <td className="py-2 pr-4 text-slate-800">{item.description}</td>
            <td className="py-2 text-right text-slate-900">${Number(item.price).toFixed(2)}</td>
          </tr>
        ))}
        <tr>
          <td colSpan={2} className="py-2 pr-4 font-semibold text-navy">Total</td>
          <td className="py-2 text-right font-semibold text-navy">${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}
