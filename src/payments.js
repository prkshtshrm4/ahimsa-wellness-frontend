import { api } from './api.js';

/** Opens Razorpay checkout and verifies payment with the backend. */
export async function payAndVerify({ booking, payment, prefill, auth = true }) {
  if (!payment?.razorpayKeyId) {
    throw new Error('Online payment is not configured. Choose pay at visit or contact the centre.');
  }
  if (!window.Razorpay) {
    throw new Error('Payment checkout could not load. Refresh the page or choose pay at visit.');
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: payment.razorpayKeyId,
      amount: payment.amountInPaise,
      currency: 'INR',
      name: 'Ahimsa Wellness Centre',
      description: booking.serviceSnapshot?.name,
      order_id: payment.razorpayOrderId,
      prefill: { name: prefill?.name, contact: prefill?.phone, email: prefill?.email },
      theme: { color: '#1C4B43' },
      handler: async (resp) => {
        try {
          const out = await api.post(
            `/bookings/${booking._id}/payment/verify`,
            {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            },
            { auth }
          );
          resolve(out);
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => reject(new Error('payment_dismissed')) },
    });
    rzp.open();
  });
}
