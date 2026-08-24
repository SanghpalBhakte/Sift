export const PAYMENT_METHOD_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_account', label: 'Bank Account / Transfer' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'other', label: 'UPI / Digital Wallet / Other' },
] as const;

export type AllowedPaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number]['value'];
