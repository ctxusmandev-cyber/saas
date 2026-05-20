import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+92${digits.slice(1)}`;
  if (digits.length === 10) return `+92${digits}`;
  return `+${digits}`;
}

async function sendSMS(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!client || !fromNumber) {
    console.log(`[notifications] Twilio not configured. Would send to ${to}: ${body}`);
    return;
  }
  try {
    await client.messages.create({ from: fromNumber, to: normalizePhone(to), body });
  } catch (err) {
    console.error("[notifications] Failed to send SMS:", err);
  }
}

const STATUS_MESSAGES: Partial<Record<string, (id: number, restaurant: string) => string>> = {
  confirmed:  (id, r) => `✅ ${r}: Your order #${id} has been confirmed and will be prepared shortly.`,
  preparing:  (id, r) => `👨‍🍳 ${r}: Your order #${id} is now being prepared. Hang tight!`,
  ready:      (id, r) => `🔔 ${r}: Your order #${id} is ready! It'll be on its way soon.`,
  delivered:  (id, r) => `🎉 ${r}: Your order #${id} has been delivered. Enjoy your meal!`,
  cancelled:  (id, r) => `❌ ${r}: Your order #${id} has been cancelled. Please contact us for details.`,
};

export async function notifyOrderPlaced(
  phone: string,
  orderId: number,
  restaurantName: string,
  total: number,
  paymentMethod: string,
): Promise<void> {
  const pm = paymentMethod === "cash_on_delivery"
    ? "Cash on Delivery"
    : paymentMethod === "jazz_cash" ? "JazzCash" : "EasyPaisa";
  const msg =
    `🧾 ${restaurantName}: Order #${orderId} received!\n` +
    `Total: Rs. ${total.toLocaleString()}\n` +
    `Payment: ${pm}\n` +
    `Track your order for live updates.`;
  await sendSMS(phone, msg);
}

export async function notifyOrderStatusChanged(
  phone: string,
  orderId: number,
  restaurantName: string,
  newStatus: string,
): Promise<void> {
  const builder = STATUS_MESSAGES[newStatus];
  if (!builder) return;
  await sendSMS(phone, builder(orderId, restaurantName));
}

export async function notifyPaymentConfirmed(
  phone: string,
  orderId: number,
  restaurantName: string,
): Promise<void> {
  const msg =
    `✅ ${restaurantName}: Your payment for order #${orderId} has been verified. ` +
    `Your order will now be prepared. Thank you!`;
  await sendSMS(phone, msg);
}
