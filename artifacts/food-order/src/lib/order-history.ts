const STORAGE_KEY = "terra_order_ids";

export function saveOrderId(orderId: number): void {
  try {
    const existing = getOrderIds();
    if (!existing.includes(orderId)) {
      const updated = [orderId, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
  }
}

export function getOrderIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
