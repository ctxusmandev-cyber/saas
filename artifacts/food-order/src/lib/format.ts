export function formatCurrency(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "Rs 0";
  return `Rs ${n.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyFull(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "Rs 0.00";
  return `Rs ${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
